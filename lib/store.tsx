"use client";

import { useSyncExternalStore } from "react";
import type { Alert, LiveState, SessionProgress } from "./types";
import { defaultSessionId } from "./cuesheet";

const STORAGE_KEY = "stageflow.live";
const CHANNEL_NAME = "stageflow-sync";

const initialState: LiveState = {
  activeSessionId: defaultSessionId,
  progressBySession: {},
  pausedAt: null,
  alert: null,
  notesOverrides: {},
};

let cachedState: LiveState = initialState;
let channel: BroadcastChannel | null = null;
let initialized = false;
let hydratedFromStorage = false;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function readFromStorage(): LiveState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...initialState, ...(JSON.parse(raw) as LiveState) };
  } catch {
    // fall through to default
  }
  return initialState;
}

function ensureBrowserListeners() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = (event: MessageEvent<LiveState>) => {
    cachedState = event.data;
    notify();
  };

  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      cachedState = { ...initialState, ...(JSON.parse(e.newValue) as LiveState) };
      notify();
    }
  });
}

function subscribe(callback: () => void): () => void {
  ensureBrowserListeners();
  listeners.add(callback);

  // React calls subscribe() from a post-commit effect, which makes this a
  // reliable place to bring in localStorage state and explicitly notify —
  // unlike hydrating inside getSnapshot(), which depends on React's internal
  // hydration-mismatch re-check actually firing (it didn't, reliably, here).
  if (!hydratedFromStorage) {
    hydratedFromStorage = true;
    const stored = readFromStorage();
    if (JSON.stringify(stored) !== JSON.stringify(cachedState)) {
      cachedState = stored;
      callback();
    }
  }

  return () => listeners.delete(callback);
}

function getSnapshot(): LiveState {
  return cachedState;
}

function getServerSnapshot(): LiveState {
  return initialState;
}

function commit(next: LiveState) {
  cachedState = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    channel ??= new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(next);
  }
  notify();
}

function activeProgress(): SessionProgress {
  return cachedState.progressBySession[cachedState.activeSessionId] ?? { currentOrder: null, startedAt: null };
}

function withProgress(sessionId: string, progress: SessionProgress): LiveState {
  return {
    ...cachedState,
    progressBySession: { ...cachedState.progressBySession, [sessionId]: progress },
  };
}

function selectSession(sessionId: string) {
  commit({ ...cachedState, activeSessionId: sessionId, pausedAt: null });
}

function start() {
  commit({
    ...withProgress(cachedState.activeSessionId, { currentOrder: 1, startedAt: new Date().toISOString() }),
    pausedAt: null,
  });
}

function next(maxOrder: number) {
  const { currentOrder } = activeProgress();
  if (currentOrder === null || currentOrder >= maxOrder) return;
  commit({
    ...withProgress(cachedState.activeSessionId, {
      currentOrder: currentOrder + 1,
      startedAt: new Date().toISOString(),
    }),
    pausedAt: null,
  });
}

function previous(minOrder: number) {
  const { currentOrder } = activeProgress();
  if (currentOrder === null || currentOrder <= minOrder) return;
  commit({
    ...withProgress(cachedState.activeSessionId, {
      currentOrder: currentOrder - 1,
      startedAt: new Date().toISOString(),
    }),
    pausedAt: null,
  });
}

function jumpTo(order: number) {
  commit({
    ...withProgress(cachedState.activeSessionId, { currentOrder: order, startedAt: new Date().toISOString() }),
    pausedAt: null,
  });
}

function finish(maxOrder: number) {
  commit({
    ...withProgress(cachedState.activeSessionId, { currentOrder: maxOrder + 1, startedAt: null }),
    pausedAt: null,
  });
}

function togglePause() {
  if (cachedState.pausedAt) {
    // Resuming: shift startedAt forward by however long we were paused so
    // the countdown picks up exactly where it left off.
    const pausedMs = Date.now() - Date.parse(cachedState.pausedAt);
    const progress = activeProgress();
    const shiftedStartedAt = progress.startedAt
      ? new Date(Date.parse(progress.startedAt) + pausedMs).toISOString()
      : null;
    commit({
      ...withProgress(cachedState.activeSessionId, { ...progress, startedAt: shiftedStartedAt }),
      pausedAt: null,
    });
  } else {
    commit({ ...cachedState, pausedAt: new Date().toISOString() });
  }
}

function setAlert(alert: Alert) {
  commit({ ...cachedState, alert });
}

function dismissAlert() {
  commit({ ...cachedState, alert: null });
}

function setNotes(programId: string, notes: string) {
  commit({ ...cachedState, notesOverrides: { ...cachedState.notesOverrides, [programId]: notes } });
}

function reset() {
  commit(initialState);
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
