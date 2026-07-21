"use client";

import { useSyncExternalStore } from "react";
import { getTransport, type TransportStatus } from "./transport";
import { supabaseBrowser } from "@/lib/supabase/client";
import { createInitialEngineState } from "./defaults";
import type {
  BroadcastDraft,
  BroadcastMessage,
  BroadcastTarget,
  BroadcastTemplate,
  BroadcastType,
  DisplayCommand,
  DisplayEngineState,
  DisplayGroup,
  DisplayInstance,
  DisplayProfile,
  DisplayType,
  EngineMessage,
  HoldState,
  TimerMode,
  TimerState,
  TimerThresholds,
} from "./types";

// ---------------------------------------------------------------------------
// This store now has two halves, not one:
//
// - Hold/Timer/Speaker-Ready/Registry/active+scheduled+history Broadcasts
//   live in Supabase (supabase/schema.sql's display_state/display_registry/
//   display_broadcasts) — genuinely cross-device now, following the exact
//   pattern lib/store.tsx already established (fetch + postgres_changes
//   Realtime for reads, API routes using the service-role key for writes).
// - Profiles/Groups/Broadcast templates/favorites/drafts stay local —
//   operator UI configuration, not live show state, out of scope for the
//   Supabase migration (see docs/DISPLAY_ENGINE.md). Same localStorage +
//   BroadcastChannel sync as before, just a smaller persisted shape.
//
// useDisplayEngine()'s public return shape is unchanged — every consuming
// component (HoldScreen, BroadcastOverlay, TimerRing, every display page)
// keeps working without modification.
// ---------------------------------------------------------------------------

const LOCAL_STORAGE_KEY = "kramflow.display-engine.local.v1";
const CLIENT_ID_KEY = "kramflow.display-engine.client-id";

function readClientId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.sessionStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = `client-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
    window.sessionStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

export function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

const clientId = typeof window !== "undefined" ? readClientId() : "server";

// ---------------------------------------------------------------------------
// Local slice — groups, profiles, broadcast templates/favorites/drafts.
// ---------------------------------------------------------------------------

interface LocalSlice {
  groups: Record<string, DisplayGroup>;
  profiles: Record<string, DisplayProfile>;
  templates: BroadcastTemplate[];
  favorites: string[];
  drafts: BroadcastDraft[];
}

function initialLocalSlice(): LocalSlice {
  const initial = createInitialEngineState();
  return {
    groups: initial.groups,
    profiles: initial.profiles,
    templates: initial.broadcasts.templates,
    favorites: initial.broadcasts.favorites,
    drafts: initial.broadcasts.drafts,
  };
}

let localSlice: LocalSlice = initialLocalSlice();
let localHydrated = false;
let localTransportConnected = false;

function persistLocal(slice: LocalSlice) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(slice));
  } catch {
    // localStorage can throw (quota, private mode) — same-tab state still works.
  }
}

function readLocalFromStorage(): LocalSlice {
  if (typeof window === "undefined") return initialLocalSlice();
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return { ...initialLocalSlice(), ...(JSON.parse(raw) as LocalSlice) };
  } catch {
    // fall through to default
  }
  return initialLocalSlice();
}

function ensureLocalTransportConnected() {
  if (localTransportConnected || typeof window === "undefined") return;
  localTransportConnected = true;
  const transport = getTransport();
  transport.subscribe((message: EngineMessage) => {
    if (message.senderId === clientId) return;
    if (message.type === "state-sync") {
      localSlice = message.payload as LocalSlice;
      persistLocal(localSlice);
      rebuild();
    }
  });
  transport.onStatusChange((status) => {
    transportStatus = status;
    notifyStatus();
  });
  transport.connect();
}

function commitLocal(next: LocalSlice) {
  localSlice = next;
  persistLocal(next);
  ensureLocalTransportConnected();
  getTransport().send({ type: "state-sync", payload: next, senderId: clientId, sentAt: new Date().toISOString() });
  rebuild();
}

// ---------------------------------------------------------------------------
// Remote slice — Hold, Timer, Speaker Ready, Registry, Broadcasts
// (active/scheduled/history). Supabase-backed.
// ---------------------------------------------------------------------------

interface RegistryRow {
  id: string;
  name: string;
  type: string;
  room: string | null;
  profile_id: string | null;
  latency_ms: number | null;
  registered_at: string;
  last_seen_at: string;
  pending_command: DisplayCommand | null;
}

interface DisplayStateRow {
  hold: HoldState;
  timer: TimerState;
  speaker_ready: Record<string, boolean>;
}

interface BroadcastRow {
  id: string;
  type: BroadcastType;
  title: string;
  message: string;
  icon: string | null;
  priority: 1 | 2 | 3;
  target: BroadcastTarget;
  created_at: string;
  expires_at: string | null;
  duration_seconds: number | null;
  acknowledgement_required: boolean;
  persistent: boolean;
  acknowledged_by: string[];
  scheduled_for: string | null;
  status: "scheduled" | "sent";
  dismissed_at: string | null;
}

function rowToInstance(row: RegistryRow): DisplayInstance {
  return {
    id: row.id,
    name: row.name,
    type: row.type as DisplayType,
    room: row.room,
    profileId: row.profile_id,
    registeredAt: row.registered_at,
    lastSeenAt: row.last_seen_at,
    latencyMs: row.latency_ms,
    pendingCommand: row.pending_command,
  };
}

function rowToMessage(row: BroadcastRow): BroadcastMessage {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    icon: row.icon,
    priority: row.priority,
    target: row.target,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    durationSeconds: row.duration_seconds,
    acknowledgementRequired: row.acknowledgement_required,
    persistent: row.persistent,
    acknowledgedBy: row.acknowledged_by,
    scheduledFor: row.scheduled_for,
  };
}

interface RemoteSlice {
  registry: Record<string, DisplayInstance>;
  timer: TimerState;
  hold: HoldState;
  speakerReady: Record<string, boolean>;
  broadcastRows: BroadcastRow[];
}

function initialRemoteSlice(): RemoteSlice {
  const initial = createInitialEngineState();
  return { registry: {}, timer: initial.timer, hold: initial.hold, speakerReady: {}, broadcastRows: [] };
}

let remoteSlice: RemoteSlice = initialRemoteSlice();
let remoteHydrated = false;
let remoteTransportConnected = false;

async function fetchRemoteSlice() {
  const client = supabaseBrowser();
  const [stateRes, registryRes, broadcastsRes] = await Promise.all([
    client.from("display_state").select("*").eq("id", 1).single(),
    client.from("display_registry").select("*"),
    client.from("display_broadcasts").select("*").order("created_at", { ascending: false }),
  ]);

  if (stateRes.error) {
    console.error("[display-engine] fetch display_state failed:", stateRes.error);
    return;
  }
  const stateRow = stateRes.data as DisplayStateRow;
  const registryRows = (registryRes.data ?? []) as RegistryRow[];
  const broadcastRows = (broadcastsRes.data ?? []) as BroadcastRow[];

  const registry: Record<string, DisplayInstance> = {};
  for (const row of registryRows) registry[row.id] = rowToInstance(row);

  remoteSlice = {
    registry,
    timer: stateRow.timer,
    hold: stateRow.hold,
    speakerReady: stateRow.speaker_ready,
    broadcastRows,
  };
  rebuild();
}

function ensureRemoteTransportConnected() {
  ensureSchedulerRunning();
  if (remoteTransportConnected || typeof window === "undefined") return;
  remoteTransportConnected = true;

  const client = supabaseBrowser();
  client
    .channel("display-engine-sync")
    .on("postgres_changes", { event: "*", schema: "public", table: "display_state" }, () => fetchRemoteSlice())
    .on("postgres_changes", { event: "*", schema: "public", table: "display_registry" }, () => fetchRemoteSlice())
    .on("postgres_changes", { event: "*", schema: "public", table: "display_broadcasts" }, () => fetchRemoteSlice())
    .subscribe();
}

// ---------------------------------------------------------------------------
// Merge local + remote into the public DisplayEngineState shape.
// ---------------------------------------------------------------------------

let cachedState: DisplayEngineState = createInitialEngineState();
const listeners = new Set<() => void>();
let transportStatus: TransportStatus = "idle";
const statusListeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function notifyStatus() {
  for (const listener of statusListeners) listener();
}

function rebuild() {
  const now = Date.now();
  const sentRows = remoteSlice.broadcastRows.filter((r) => r.status === "sent");
  cachedState = {
    registry: remoteSlice.registry,
    groups: localSlice.groups,
    profiles: localSlice.profiles,
    timer: remoteSlice.timer,
    hold: remoteSlice.hold,
    broadcasts: {
      active: sentRows.filter((r) => r.dismissed_at === null).map(rowToMessage),
      scheduled: remoteSlice.broadcastRows.filter((r) => r.status === "scheduled").map(rowToMessage),
      history: sentRows.slice(0, 200).map(rowToMessage),
      templates: localSlice.templates,
      favorites: localSlice.favorites,
      drafts: localSlice.drafts,
    },
    speakerReady: remoteSlice.speakerReady,
  };
  void now; // reserved for future expiry-aware filtering if ever needed store-side
  notify();
}

// Same hydrate-inside-subscribe() pattern as lib/store.tsx — see that
// file's comment for why hydrating inside getSnapshot() alone doesn't
// reliably trigger a re-render.
function subscribe(callback: () => void): () => void {
  ensureLocalTransportConnected();
  ensureRemoteTransportConnected();
  listeners.add(callback);

  if (!localHydrated) {
    localHydrated = true;
    const stored = readLocalFromStorage();
    if (JSON.stringify(stored) !== JSON.stringify(localSlice)) {
      localSlice = stored;
    }
  }
  if (!remoteHydrated) {
    remoteHydrated = true;
    fetchRemoteSlice().then(callback);
  }
  rebuild();

  return () => listeners.delete(callback);
}

function getSnapshot(): DisplayEngineState {
  return cachedState;
}

// A stable reference, not a fresh createInitialEngineState() call each
// time — useSyncExternalStore requires getServerSnapshot to return the
// same reference across calls when nothing changed, or React logs "should
// be cached to avoid an infinite loop" (same bug class as lib/use-sessions.ts
// hit earlier this session; caught here via live cross-browser testing).
const SERVER_SNAPSHOT: DisplayEngineState = createInitialEngineState();

function getServerSnapshot(): DisplayEngineState {
  return SERVER_SNAPSHOT;
}

function subscribeStatus(callback: () => void): () => void {
  ensureLocalTransportConnected();
  statusListeners.add(callback);
  return () => statusListeners.delete(callback);
}

function getStatusSnapshot(): TransportStatus {
  return transportStatus;
}

function getServerStatusSnapshot(): TransportStatus {
  return "idle";
}

async function postJson(url: string, body: unknown) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) console.error("[display-engine] POST failed:", url, res.status);
    return res;
  } catch (err) {
    console.error("[display-engine] POST failed:", url, err);
    return null;
  }
}

// Retries once on 409 — app/api/display-engine/timer/route.ts (the only
// route on this path with an optimistic-concurrency check today) returns
// that when timer_version changed between its read and write. Same
// reasoning as lib/store.tsx's sendAction: resending succeeds once the
// other write has landed, and a repeat conflict is vanishingly unlikely.
async function patchJson(url: string, body: unknown, attempt = 0): Promise<Response | null> {
  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 409 && attempt < 2) return patchJson(url, body, attempt + 1);
    if (!res.ok) console.error("[display-engine] PATCH failed:", url, res.status);
    return res;
  } catch (err) {
    console.error("[display-engine] PATCH failed:", url, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Display registry actions — Supabase-backed
// ---------------------------------------------------------------------------

function registerDisplay(input: { id: string; name: string; type: DisplayType; room?: string | null }) {
  return postJson("/api/display-engine/registry", { id: input.id, name: input.name, type: input.type, room: input.room ?? null });
}

function heartbeatDisplay(id: string, latencyMs: number | null) {
  return postJson("/api/display-engine/registry", { id, latencyMs });
}

function renameDisplay(id: string, name: string) {
  return patchJson(`/api/display-engine/registry/${id}`, { name });
}

function assignDisplay(id: string, patch: { type?: DisplayType; room?: string | null; profileId?: string | null }) {
  return patchJson(`/api/display-engine/registry/${id}`, patch);
}

function removeDisplay(id: string) {
  return fetch(`/api/display-engine/registry/${id}`, { method: "DELETE" }).catch((err) =>
    console.error("[display-engine] removeDisplay failed:", err)
  );
}

function sendCommand(id: string, command: DisplayCommand) {
  return patchJson(`/api/display-engine/registry/${id}`, { pendingCommand: command });
}

function clearCommand(id: string) {
  return patchJson(`/api/display-engine/registry/${id}`, { pendingCommand: null });
}

// ---------------------------------------------------------------------------
// Groups — local only
// ---------------------------------------------------------------------------

function createGroup(name: string, displayIds: string[]): string {
  const id = newId("group");
  const group: DisplayGroup = { id, name, displayIds };
  commitLocal({ ...localSlice, groups: { ...localSlice.groups, [id]: group } });
  return id;
}

function updateGroup(id: string, patch: Partial<Omit<DisplayGroup, "id">>) {
  const existing = localSlice.groups[id];
  if (!existing) return;
  commitLocal({ ...localSlice, groups: { ...localSlice.groups, [id]: { ...existing, ...patch } } });
}

function deleteGroup(id: string) {
  const next = { ...localSlice.groups };
  delete next[id];
  commitLocal({ ...localSlice, groups: next });
}

// ---------------------------------------------------------------------------
// Timer engine actions — Supabase-backed
// ---------------------------------------------------------------------------

function setTimerMode(mode: TimerMode) {
  return patchJson("/api/display-engine/timer", { action: "setMode", mode });
}

function setTimerSource(source: "auto" | "manual") {
  return patchJson("/api/display-engine/timer", { action: "setSource", source });
}

function startManualTimer(durationSeconds: number) {
  return patchJson("/api/display-engine/timer", { action: "start", durationSeconds });
}

function pauseTimer() {
  return patchJson("/api/display-engine/timer", { action: "pause" });
}

function resumeTimer() {
  return patchJson("/api/display-engine/timer", { action: "resume" });
}

function resetTimer() {
  return patchJson("/api/display-engine/timer", { action: "reset" });
}

function adjustTimer(deltaSeconds: number) {
  return patchJson("/api/display-engine/timer", { action: "adjust", deltaSeconds });
}

function setTimerThresholds(thresholds: TimerThresholds) {
  return patchJson("/api/display-engine/timer", { action: "setThresholds", thresholds });
}

// ---------------------------------------------------------------------------
// Hold mode — Supabase-backed
// ---------------------------------------------------------------------------

function activateHold(input: { message: string; subMessage: string | null; continueClock: boolean }) {
  return patchJson("/api/display-engine/hold", { active: true, ...input });
}

function deactivateHold() {
  return patchJson("/api/display-engine/hold", { active: false });
}

// ---------------------------------------------------------------------------
// Broadcast Center — active/scheduled/history Supabase-backed;
// templates/favorites/drafts stay local.
// ---------------------------------------------------------------------------

function sendBroadcast(draft: BroadcastDraft) {
  return postJson("/api/display-engine/broadcasts", { draft });
}

function scheduleBroadcast(draft: BroadcastDraft, scheduledFor: string) {
  return postJson("/api/display-engine/broadcasts", { draft, scheduledFor });
}

function cancelScheduled(id: string) {
  return fetch(`/api/display-engine/broadcasts/${id}`, { method: "DELETE" }).catch((err) =>
    console.error("[display-engine] cancelScheduled failed:", err)
  );
}

// Runs in whichever display-engine tab happens to have this module loaded
// — same "any open tab can process" model the rest of the store already
// relies on. A scheduled broadcast only fires once some tab notices it
// crossed its scheduledFor time; there is no server-side cron in this
// environment (Supabase pg_cron or a Vercel Cron Job would be needed to
// close this gap properly). Documented as a known limitation in
// docs/DISPLAY_ENGINE.md — carried forward from before this migration,
// not solved by it.
let schedulerRunning = false;
function ensureSchedulerRunning() {
  if (schedulerRunning || typeof window === "undefined") return;
  schedulerRunning = true;
  setInterval(() => {
    const now = Date.now();
    const due = remoteSlice.broadcastRows.filter(
      (r) => r.status === "scheduled" && r.scheduled_for && Date.parse(r.scheduled_for) <= now
    );
    for (const row of due) postJson(`/api/display-engine/broadcasts/${row.id}/promote`, {});
  }, 5000);
}

function dismissBroadcast(id: string) {
  return postJson(`/api/display-engine/broadcasts/${id}/dismiss`, {});
}

function acknowledgeBroadcast(id: string, displayId: string) {
  return postJson(`/api/display-engine/broadcasts/${id}/acknowledge`, { displayId });
}

function clearEmergencies() {
  const active = remoteSlice.broadcastRows.filter((r) => r.status === "sent" && r.dismissed_at === null && r.type === "emergency");
  return Promise.all(active.map((row) => dismissBroadcast(row.id)));
}

function saveTemplate(name: string, draft: BroadcastDraft): string {
  const id = newId("template");
  const template: BroadcastTemplate = { id, name, draft };
  commitLocal({ ...localSlice, templates: [template, ...localSlice.templates] });
  return id;
}

function deleteTemplate(id: string) {
  commitLocal({
    ...localSlice,
    templates: localSlice.templates.filter((t) => t.id !== id),
    favorites: localSlice.favorites.filter((f) => f !== id),
  });
}

function toggleFavoriteTemplate(id: string) {
  const favorites = localSlice.favorites.includes(id)
    ? localSlice.favorites.filter((f) => f !== id)
    : [...localSlice.favorites, id];
  commitLocal({ ...localSlice, favorites });
}

function saveDraft(draft: BroadcastDraft) {
  commitLocal({ ...localSlice, drafts: [draft, ...localSlice.drafts].slice(0, 20) });
}

function deleteDraft(index: number) {
  commitLocal({ ...localSlice, drafts: localSlice.drafts.filter((_, i) => i !== index) });
}

// ---------------------------------------------------------------------------
// Speaker ready (Green Room) — Supabase-backed
// ---------------------------------------------------------------------------

function setSpeakerReady(programId: string, ready: boolean) {
  return patchJson("/api/display-engine/speaker-ready", { programId, ready });
}

// ---------------------------------------------------------------------------
// Profiles — local only
// ---------------------------------------------------------------------------

function saveProfile(profile: DisplayProfile) {
  commitLocal({ ...localSlice, profiles: { ...localSlice.profiles, [profile.id]: profile } });
}

function deleteProfile(id: string) {
  const target = localSlice.profiles[id];
  if (!target || target.builtIn) return;
  const next = { ...localSlice.profiles };
  delete next[id];
  commitLocal({ ...localSlice, profiles: next });
}

// ---------------------------------------------------------------------------
// Public hooks
// ---------------------------------------------------------------------------

export function useDisplayEngine() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    state,
    clientId,
    registerDisplay,
    heartbeatDisplay,
    renameDisplay,
    assignDisplay,
    removeDisplay,
    sendCommand,
    clearCommand,
    createGroup,
    updateGroup,
    deleteGroup,
    setTimerMode,
    setTimerSource,
    startManualTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    adjustTimer,
    setTimerThresholds,
    activateHold,
    deactivateHold,
    sendBroadcast,
    scheduleBroadcast,
    cancelScheduled,
    dismissBroadcast,
    acknowledgeBroadcast,
    clearEmergencies,
    saveTemplate,
    deleteTemplate,
    toggleFavoriteTemplate,
    saveDraft,
    deleteDraft,
    saveProfile,
    deleteProfile,
    setSpeakerReady,
  };
}

export function useTransportStatus(): TransportStatus {
  return useSyncExternalStore(subscribeStatus, getStatusSnapshot, getServerStatusSnapshot);
}

export function targetMatchesDisplay(target: BroadcastTarget, display: DisplayInstance, groups: Record<string, DisplayGroup>): boolean {
  switch (target.kind) {
    case "all":
      return true;
    case "type":
      return target.value === display.type;
    case "display":
      return target.value === display.id;
    case "group":
      return target.value ? (groups[target.value]?.displayIds.includes(display.id) ?? false) : false;
    default:
      return false;
  }
}
