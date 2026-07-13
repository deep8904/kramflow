"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

const SESSION_KEY = "kramflow.auth";

type Status = "checking" | "locked" | "unlocked";

let cachedStatus: Status = "checking";
let hydrated = false;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

// Hydrating inside subscribe() (which React guarantees to call post-commit)
// rather than getSnapshot() is deliberate — see lib/store.tsx for why the
// getSnapshot-only approach silently failed to re-render here before.
function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  if (!hydrated) {
    hydrated = true;
    const real: Status = window.sessionStorage.getItem(SESSION_KEY) === "1" ? "unlocked" : "locked";
    cachedStatus = real;
    callback();
  }
  return () => listeners.delete(callback);
}

function getSnapshot(): Status {
  return cachedStatus;
}

function getServerSnapshot(): Status {
  return "checking";
}

function unlock() {
  window.sessionStorage.setItem(SESSION_KEY, "1");
  cachedStatus = "unlocked";
  notify();
}

function lock() {
  window.sessionStorage.removeItem(SESSION_KEY);
  cachedStatus = "locked";
  notify();
}

interface AuthContextValue {
  status: Status;
  unlock: () => void;
  lock: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const status = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return <AuthContext.Provider value={{ status, unlock, lock }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
