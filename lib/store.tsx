"use client";

import { useSyncExternalStore } from "react";
import type { Alert, LiveState } from "./types";
import { supabaseBrowser } from "./supabase/client";

// Live-state store — Supabase-backed (see supabase/schema.sql's `live_state`
// singleton row and docs/ARCHITECTURE.md's "State flow"). Public shape is
// unchanged from the pre-Supabase localStorage/BroadcastChannel version on
// purpose: every action here is the same fetch-and-call surface
// (`start()`, `next()`, ...), so no consuming component needed to change
// for this swap — including the Display Engine (`lib/display-engine/*`),
// which reads this same `useEventStore()`.
//
// Reads: hydrate once from Supabase, then stay current via Realtime on the
// `live_state` row. Writes: POST to app/api/live/route.ts (PATCH), which
// applies the mutation server-side and appends an activity_log row — the
// Realtime subscription is what brings the result back into this store,
// not the fetch response itself (kept deliberately optimistic-free for
// correctness; the round trip is well under the ~1s propagation target).

const initialState: LiveState = {
  activeSessionId: "",
  progressBySession: {},
  pausedAt: null,
  alert: null,
  notesOverrides: {},
};

let cachedState: LiveState = initialState;
let initialized = false;
let hydrating = false;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

interface LiveStateRow {
  active_session_id: string | null;
  paused_at: string | null;
  alert: Alert | null;
  progress_by_session: LiveState["progressBySession"];
  notes_overrides: LiveState["notesOverrides"];
}

function mapRow(row: LiveStateRow): LiveState {
  return {
    activeSessionId: row.active_session_id ?? "",
    progressBySession: row.progress_by_session ?? {},
    pausedAt: row.paused_at,
    alert: row.alert,
    notesOverrides: row.notes_overrides ?? {},
  };
}

async function hydrate() {
  if (hydrating) return;
  hydrating = true;
  try {
    const { data, error } = await supabaseBrowser().from("live_state").select("*").eq("id", 1).single();
    if (error) throw error;
    cachedState = mapRow(data as LiveStateRow);
    notify();
  } catch (err) {
    console.error("[store] hydrate failed:", err);
  } finally {
    hydrating = false;
  }
}

function ensureBrowserListeners() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  supabaseBrowser()
    .channel("live-state-sync")
    .on("postgres_changes", { event: "*", schema: "public", table: "live_state" }, (payload) => {
      cachedState = mapRow(payload.new as LiveStateRow);
      notify();
    })
    .subscribe();
}

function subscribe(callback: () => void): () => void {
  ensureBrowserListeners();
  listeners.add(callback);

  if (!hydrating && cachedState === initialState) {
    hydrate().then(callback);
  }

  return () => listeners.delete(callback);
}

function getSnapshot(): LiveState {
  return cachedState;
}

function getServerSnapshot(): LiveState {
  return initialState;
}

async function sendAction(body: Record<string, unknown>) {
  try {
    const res = await fetch("/api/live", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) console.error("[store] action failed:", body.action, res.status);
  } catch (err) {
    console.error("[store] action failed:", body.action, err);
  }
}

function selectSession(sessionId: string) {
  sendAction({ action: "selectSession", sessionId });
}

function start() {
  sendAction({ action: "start" });
}

function next(maxOrder: number) {
  sendAction({ action: "next", maxOrder });
}

function previous(minOrder: number) {
  sendAction({ action: "previous", minOrder });
}

function jumpTo(order: number) {
  sendAction({ action: "jumpTo", order });
}

function finish(maxOrder: number) {
  sendAction({ action: "finish", maxOrder });
}

function togglePause() {
  sendAction({ action: "togglePause" });
}

function setAlert(alert: Alert) {
  sendAction({ action: "setAlert", alert });
}

function dismissAlert() {
  sendAction({ action: "dismissAlert" });
}

function setNotes(programId: string, notes: string) {
  sendAction({ action: "setNotes", programId, notes });
}

function reset() {
  sendAction({ action: "reset" });
}

export function useEventStore() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    state,
    selectSession,
    start,
    next,
    previous,
    jumpTo,
    finish,
    togglePause,
    setAlert,
    dismissAlert,
    setNotes,
    reset,
  };
}
