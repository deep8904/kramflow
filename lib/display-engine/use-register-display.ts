"use client";

import { useEffect, useRef } from "react";
import { useDisplayEngine } from "./store";
import { useTimeSync } from "./use-time-sync";
import type { DisplayCommand, DisplayInstance, DisplayType } from "./types";

const HEARTBEAT_INTERVAL_MS = 15000;
export const OFFLINE_AFTER_MS = 45000;

export function getDisplayStatus(display: DisplayInstance, nowMs: number): "online" | "offline" {
  return nowMs - Date.parse(display.lastSeenAt) > OFFLINE_AFTER_MS ? "offline" : "online";
}

/**
 * Call once from any display page. Registers this browser tab in the
 * Display Registry, sends a heartbeat (with a latency sample) on an
 * interval, and hands back any pending command the Display Manager has
 * issued (test message, force fullscreen, reload) so the page can act on
 * it and clear it.
 */
export function useRegisterDisplay(
  name: string,
  type: DisplayType,
  room: string | null,
  onCommand?: (command: DisplayCommand) => void
) {
  const { state, clientId, registerDisplay, heartbeatDisplay, clearCommand } = useDisplayEngine();
  const { latencyMs, resync } = useTimeSync();

  const onCommandRef = useRef(onCommand);
  const latencyRef = useRef(latencyMs);
  useEffect(() => {
    onCommandRef.current = onCommand;
    latencyRef.current = latencyMs;
  });

  useEffect(() => {
    registerDisplay({ id: clientId, name, type, room });
    resync();
    const interval = setInterval(() => {
      heartbeatDisplay(clientId, latencyRef.current);
    }, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [clientId, name, type, room, registerDisplay, heartbeatDisplay, resync]);

  useEffect(() => {
    const command = state.registry[clientId]?.pendingCommand;
    if (command && onCommandRef.current) {
      onCommandRef.current(command);
      clearCommand(clientId);
    }
  }, [state.registry, clientId, clearCommand]);

  return state.registry[clientId] ?? null;
}
