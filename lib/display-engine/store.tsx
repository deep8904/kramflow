"use client";

import { useSyncExternalStore } from "react";
import { getTransport, type TransportStatus } from "./transport";
import { createInitialEngineState } from "./defaults";
import type {
  BroadcastDraft,
  BroadcastMessage,
  BroadcastTarget,
  BroadcastTemplate,
  DisplayCommand,
  DisplayEngineState,
  DisplayGroup,
  DisplayInstance,
  DisplayProfile,
  DisplayType,
  EngineMessage,
  HoldState,
  TimerMode,
  TimerThresholds,
} from "./types";

const STORAGE_KEY = "kramflow.display-engine.v1";
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

const initialState = createInitialEngineState();

let cachedState: DisplayEngineState = initialState;
// Resolved eagerly at module init (not inside ensureTransportConnected(),
// which only runs post-commit via subscribe()) so the very first render of
// any consumer already sees the real per-tab id instead of the SSR "server"
// fallback — otherwise a fast-firing effect like useRegisterDisplay's could
// register a bogus "server" entry before the real id was ever assigned.
let clientId = typeof window !== "undefined" ? readClientId() : "server";
let hydrated = false;
let transportConnected = false;
const listeners = new Set<() => void>();
let transportStatus: TransportStatus = "idle";
const statusListeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function notifyStatus() {
  for (const listener of statusListeners) listener();
}

function readFromStorage(): DisplayEngineState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...initialState, ...(JSON.parse(raw) as DisplayEngineState) };
  } catch {
    // fall through to default
  }
  return initialState;
}

function persist(state: DisplayEngineState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage can throw (quota, private mode) — sync still works via the transport for this tab session.
  }
}

function ensureTransportConnected() {
  ensureSchedulerRunning();
  if (transportConnected || typeof window === "undefined") return;
  transportConnected = true;
  clientId = readClientId();

  const transport = getTransport();
  transport.subscribe((message: EngineMessage) => {
    if (message.senderId === clientId) return;
    if (message.type === "state-sync") {
      cachedState = message.payload as DisplayEngineState;
      persist(cachedState);
      notify();
    }
  });
  transport.onStatusChange((status) => {
    transportStatus = status;
    notifyStatus();
  });
  transport.connect();
}

// Same hydrate-inside-subscribe() pattern as lib/store.tsx and
// components/auth/auth-context.tsx — see those files for why hydrating
// inside getSnapshot() alone doesn't reliably trigger a re-render here.
function subscribe(callback: () => void): () => void {
  ensureTransportConnected();
  listeners.add(callback);
  if (!hydrated) {
    hydrated = true;
    const stored = readFromStorage();
    if (JSON.stringify(stored) !== JSON.stringify(cachedState)) {
      cachedState = stored;
      callback();
    }
  }
  return () => listeners.delete(callback);
}

function getSnapshot(): DisplayEngineState {
  return cachedState;
}

function getServerSnapshot(): DisplayEngineState {
  return initialState;
}

function subscribeStatus(callback: () => void): () => void {
  ensureTransportConnected();
  statusListeners.add(callback);
  return () => statusListeners.delete(callback);
}

function getStatusSnapshot(): TransportStatus {
  return transportStatus;
}

function getServerStatusSnapshot(): TransportStatus {
  return "idle";
}

function commit(next: DisplayEngineState) {
  cachedState = next;
  persist(next);
  ensureTransportConnected();
  getTransport().send({
    type: "state-sync",
    payload: next,
    senderId: clientId,
    sentAt: new Date().toISOString(),
  });
  notify();
}

// ---------------------------------------------------------------------------
// Display registry actions
// ---------------------------------------------------------------------------

function registerDisplay(input: { id: string; name: string; type: DisplayType; room?: string | null }) {
  const now = new Date().toISOString();
  const existing = cachedState.registry[input.id];
  const instance: DisplayInstance = {
    id: input.id,
    name: existing?.name ?? input.name,
    type: input.type,
    room: existing?.room ?? input.room ?? null,
    profileId: existing?.profileId ?? null,
    registeredAt: existing?.registeredAt ?? now,
    lastSeenAt: now,
    latencyMs: existing?.latencyMs ?? null,
    pendingCommand: existing?.pendingCommand ?? null,
  };
  commit({ ...cachedState, registry: { ...cachedState.registry, [input.id]: instance } });
}

function heartbeatDisplay(id: string, latencyMs: number | null) {
  const existing = cachedState.registry[id];
  if (!existing) return;
  commit({
    ...cachedState,
    registry: {
      ...cachedState.registry,
      [id]: { ...existing, lastSeenAt: new Date().toISOString(), latencyMs },
    },
  });
}

function renameDisplay(id: string, name: string) {
  const existing = cachedState.registry[id];
  if (!existing) return;
  commit({ ...cachedState, registry: { ...cachedState.registry, [id]: { ...existing, name } } });
}

function assignDisplay(id: string, patch: { type?: DisplayType; room?: string | null; profileId?: string | null }) {
  const existing = cachedState.registry[id];
  if (!existing) return;
  commit({ ...cachedState, registry: { ...cachedState.registry, [id]: { ...existing, ...patch } } });
}

function removeDisplay(id: string) {
  const next = { ...cachedState.registry };
  delete next[id];
  commit({ ...cachedState, registry: next });
}

function sendCommand(id: string, command: DisplayCommand) {
  const existing = cachedState.registry[id];
  if (!existing) return;
  commit({ ...cachedState, registry: { ...cachedState.registry, [id]: { ...existing, pendingCommand: command } } });
}

function clearCommand(id: string) {
  const existing = cachedState.registry[id];
  if (!existing || !existing.pendingCommand) return;
  commit({ ...cachedState, registry: { ...cachedState.registry, [id]: { ...existing, pendingCommand: null } } });
}

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

function createGroup(name: string, displayIds: string[]): string {
  const id = newId("group");
  const group: DisplayGroup = { id, name, displayIds };
  commit({ ...cachedState, groups: { ...cachedState.groups, [id]: group } });
  return id;
}

function updateGroup(id: string, patch: Partial<Omit<DisplayGroup, "id">>) {
  const existing = cachedState.groups[id];
  if (!existing) return;
  commit({ ...cachedState, groups: { ...cachedState.groups, [id]: { ...existing, ...patch } } });
}

function deleteGroup(id: string) {
  const next = { ...cachedState.groups };
  delete next[id];
  commit({ ...cachedState, groups: next });
}

// ---------------------------------------------------------------------------
// Timer engine actions
// ---------------------------------------------------------------------------

function setTimerMode(mode: TimerMode) {
  commit({ ...cachedState, timer: { ...cachedState.timer, mode } });
}

function setTimerSource(source: "auto" | "manual") {
  commit({ ...cachedState, timer: { ...cachedState.timer, source } });
}

function startManualTimer(durationSeconds: number) {
  commit({
    ...cachedState,
    timer: {
      ...cachedState.timer,
      source: "manual",
      durationSeconds,
      adjustmentSeconds: 0,
      startedAt: new Date().toISOString(),
      pausedAt: null,
    },
  });
}

function pauseTimer() {
  if (cachedState.timer.pausedAt) return;
  commit({ ...cachedState, timer: { ...cachedState.timer, pausedAt: new Date().toISOString() } });
}

function resumeTimer() {
  const { timer } = cachedState;
  if (!timer.pausedAt || !timer.startedAt) {
    commit({ ...cachedState, timer: { ...timer, pausedAt: null } });
    return;
  }
  const pausedMs = Date.now() - Date.parse(timer.pausedAt);
  const shiftedStartedAt = new Date(Date.parse(timer.startedAt) + pausedMs).toISOString();
  commit({ ...cachedState, timer: { ...timer, startedAt: shiftedStartedAt, pausedAt: null } });
}

function resetTimer() {
  commit({
    ...cachedState,
    timer: { ...cachedState.timer, startedAt: null, pausedAt: null, adjustmentSeconds: 0 },
  });
}

function adjustTimer(deltaSeconds: number) {
  commit({
    ...cachedState,
    timer: { ...cachedState.timer, adjustmentSeconds: cachedState.timer.adjustmentSeconds + deltaSeconds },
  });
}

function setTimerThresholds(thresholds: TimerThresholds) {
  commit({ ...cachedState, timer: { ...cachedState.timer, thresholds } });
}

// ---------------------------------------------------------------------------
// Hold mode
// ---------------------------------------------------------------------------

function activateHold(input: { message: string; subMessage: string | null; continueClock: boolean }) {
  const hold: HoldState = { active: true, ...input, activatedAt: new Date().toISOString() };
  commit({ ...cachedState, hold });
}

function deactivateHold() {
  commit({ ...cachedState, hold: { ...cachedState.hold, active: false, activatedAt: null } });
}

// ---------------------------------------------------------------------------
// Broadcast Center
// ---------------------------------------------------------------------------

function sendBroadcast(draft: BroadcastDraft): BroadcastMessage {
  const now = new Date();
  const message: BroadcastMessage = {
    id: newId("broadcast"),
    type: draft.type,
    title: draft.title,
    message: draft.message,
    icon: draft.icon,
    priority: draft.priority,
    target: draft.target,
    createdAt: now.toISOString(),
    expiresAt: draft.expiresInMinutes ? new Date(now.getTime() + draft.expiresInMinutes * 60000).toISOString() : null,
    durationSeconds: draft.durationSeconds,
    acknowledgementRequired: draft.acknowledgementRequired,
    persistent: draft.persistent,
    acknowledgedBy: [],
    scheduledFor: null,
  };
  const history = [message, ...cachedState.broadcasts.history].slice(0, 200);
  commit({
    ...cachedState,
    broadcasts: { ...cachedState.broadcasts, active: [message, ...cachedState.broadcasts.active], history },
  });
  return message;
}

function scheduleBroadcast(draft: BroadcastDraft, scheduledFor: string): BroadcastMessage {
  const message: BroadcastMessage = {
    id: newId("broadcast"),
    type: draft.type,
    title: draft.title,
    message: draft.message,
    icon: draft.icon,
    priority: draft.priority,
    target: draft.target,
    createdAt: new Date().toISOString(),
    expiresAt: draft.expiresInMinutes ? new Date(Date.parse(scheduledFor) + draft.expiresInMinutes * 60000).toISOString() : null,
    durationSeconds: draft.durationSeconds,
    acknowledgementRequired: draft.acknowledgementRequired,
    persistent: draft.persistent,
    acknowledgedBy: [],
    scheduledFor,
  };
  commit({
    ...cachedState,
    broadcasts: { ...cachedState.broadcasts, scheduled: [message, ...cachedState.broadcasts.scheduled] },
  });
  return message;
}

function cancelScheduled(id: string) {
  commit({
    ...cachedState,
    broadcasts: {
      ...cachedState.broadcasts,
      scheduled: cachedState.broadcasts.scheduled.filter((m) => m.id !== id),
    },
  });
}

// Runs in whichever display-engine tab happens to have this module loaded —
// same "any open tab can process" model the rest of the store already
// relies on for cross-tab sync. A scheduled broadcast only fires once some
// tab (an open display, the Broadcast Center, etc.) is around to notice it
// crossed its scheduledFor time; there is no server-side cron in this
// environment. Documented as a known limitation in docs/DISPLAY_ENGINE.md.
let schedulerRunning = false;
function ensureSchedulerRunning() {
  if (schedulerRunning || typeof window === "undefined") return;
  schedulerRunning = true;
  setInterval(() => {
    const now = Date.now();
    const due = cachedState.broadcasts.scheduled.filter((m) => m.scheduledFor && Date.parse(m.scheduledFor) <= now);
    if (due.length === 0) return;
    const stillScheduled = cachedState.broadcasts.scheduled.filter((m) => !due.includes(m));
    const promoted = due.map((m) => ({ ...m, scheduledFor: null }));
    const history = [...promoted, ...cachedState.broadcasts.history].slice(0, 200);
    commit({
      ...cachedState,
      broadcasts: {
        ...cachedState.broadcasts,
        scheduled: stillScheduled,
        active: [...promoted, ...cachedState.broadcasts.active],
        history,
      },
    });
  }, 5000);
}

function dismissBroadcast(id: string) {
  commit({
    ...cachedState,
    broadcasts: {
      ...cachedState.broadcasts,
      active: cachedState.broadcasts.active.filter((b) => b.id !== id),
    },
  });
}

function acknowledgeBroadcast(id: string, displayId: string) {
  const active = cachedState.broadcasts.active.map((b) =>
    b.id === id && !b.acknowledgedBy.includes(displayId)
      ? { ...b, acknowledgedBy: [...b.acknowledgedBy, displayId] }
      : b
  );
  commit({ ...cachedState, broadcasts: { ...cachedState.broadcasts, active } });
}

function clearEmergencies() {
  commit({
    ...cachedState,
    broadcasts: {
      ...cachedState.broadcasts,
      active: cachedState.broadcasts.active.filter((b) => b.type !== "emergency"),
    },
  });
}

function saveTemplate(name: string, draft: BroadcastDraft): string {
  const id = newId("template");
  const template: BroadcastTemplate = { id, name, draft };
  commit({
    ...cachedState,
    broadcasts: { ...cachedState.broadcasts, templates: [template, ...cachedState.broadcasts.templates] },
  });
  return id;
}

function deleteTemplate(id: string) {
  commit({
    ...cachedState,
    broadcasts: {
      ...cachedState.broadcasts,
      templates: cachedState.broadcasts.templates.filter((t) => t.id !== id),
      favorites: cachedState.broadcasts.favorites.filter((f) => f !== id),
    },
  });
}

function toggleFavoriteTemplate(id: string) {
  const favorites = cachedState.broadcasts.favorites.includes(id)
    ? cachedState.broadcasts.favorites.filter((f) => f !== id)
    : [...cachedState.broadcasts.favorites, id];
  commit({ ...cachedState, broadcasts: { ...cachedState.broadcasts, favorites } });
}

function saveDraft(draft: BroadcastDraft) {
  commit({ ...cachedState, broadcasts: { ...cachedState.broadcasts, drafts: [draft, ...cachedState.broadcasts.drafts].slice(0, 20) } });
}

function deleteDraft(index: number) {
  const drafts = cachedState.broadcasts.drafts.filter((_, i) => i !== index);
  commit({ ...cachedState, broadcasts: { ...cachedState.broadcasts, drafts } });
}

// ---------------------------------------------------------------------------
// Speaker ready (Green Room)
// ---------------------------------------------------------------------------

function setSpeakerReady(programId: string, ready: boolean) {
  commit({ ...cachedState, speakerReady: { ...cachedState.speakerReady, [programId]: ready } });
}

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

function saveProfile(profile: DisplayProfile) {
  commit({ ...cachedState, profiles: { ...cachedState.profiles, [profile.id]: profile } });
}

function deleteProfile(id: string) {
  const target = cachedState.profiles[id];
  if (!target || target.builtIn) return;
  const next = { ...cachedState.profiles };
  delete next[id];
  commit({ ...cachedState, profiles: next });
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
