"use client";

/**
 * Real-time synchronization layer for the Display Engine.
 *
 * `RealtimeTransport` is the abstraction every other engine module talks
 * to. Two implementations exist behind the same interface:
 *
 * - `BroadcastChannelTransport` — zero-config, works today, same-browser
 *   only. This mirrors the pattern already proven in `lib/store.tsx`
 *   (localStorage persist + BroadcastChannel notify) and is the default,
 *   so the Display Engine works out of the box in dev and in this
 *   environment without any additional infrastructure.
 * - `WebSocketTransport` — a real WebSocket client with reconnect/backoff,
 *   used automatically when `NEXT_PUBLIC_DISPLAY_ENGINE_WS_URL` is set.
 *   This is the path for genuine cross-device sync (a phone and a lobby
 *   TV in different browsers). It expects a server that simply
 *   broadcasts every received message to every other connected client —
 *   see `scripts/display-engine-ws-server.mjs` for a minimal reference
 *   implementation, and `docs/DISPLAY_ENGINE.md` for deployment notes.
 *
 * Swapping transports never requires touching a component — everything
 * goes through `getTransport()`.
 */

import type { EngineMessage } from "./types";

export type TransportStatus = "idle" | "connecting" | "open" | "closed" | "error";

export interface RealtimeTransport {
  readonly kind: "broadcast-channel" | "websocket";
  status: TransportStatus;
  connect(): void;
  disconnect(): void;
  send(message: EngineMessage): void;
  subscribe(handler: (message: EngineMessage) => void): () => void;
  onStatusChange(handler: (status: TransportStatus) => void): () => void;
}

const CHANNEL_NAME = "kramflow-display-engine";

class BroadcastChannelTransport implements RealtimeTransport {
  readonly kind = "broadcast-channel" as const;
  status: TransportStatus = "idle";

  private channel: BroadcastChannel | null = null;
  private listeners = new Set<(message: EngineMessage) => void>();
  private statusListeners = new Set<(status: TransportStatus) => void>();

  connect() {
    if (this.channel || typeof window === "undefined") return;
    this.channel = new BroadcastChannel(CHANNEL_NAME);
    this.channel.onmessage = (event: MessageEvent<EngineMessage>) => {
      for (const listener of this.listeners) listener(event.data);
    };
    this.setStatus("open");
  }

  disconnect() {
    this.channel?.close();
    this.channel = null;
    this.setStatus("closed");
  }

  send(message: EngineMessage) {
    this.channel?.postMessage(message);
  }

  subscribe(handler: (message: EngineMessage) => void) {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  onStatusChange(handler: (status: TransportStatus) => void) {
    this.statusListeners.add(handler);
    return () => this.statusListeners.delete(handler);
  }

  private setStatus(status: TransportStatus) {
    this.status = status;
    for (const listener of this.statusListeners) listener(status);
  }
}

const RECONNECT_DELAYS_MS = [500, 1000, 2000, 4000, 8000, 15000];

class WebSocketTransport implements RealtimeTransport {
  readonly kind = "websocket" as const;
  status: TransportStatus = "idle";

  private ws: WebSocket | null = null;
  private listeners = new Set<(message: EngineMessage) => void>();
  private statusListeners = new Set<(status: TransportStatus) => void>();
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private explicitlyClosed = false;
  private queue: EngineMessage[] = [];

  constructor(private readonly url: string) {}

  connect() {
    if (typeof window === "undefined") return;
    this.explicitlyClosed = false;
    this.openSocket();
  }

  disconnect() {
    this.explicitlyClosed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
    this.setStatus("closed");
  }

  send(message: EngineMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue while disconnected/reconnecting so a temporary network blip
      // doesn't silently drop an operator action — flushed on reopen.
      this.queue.push(message);
    }
  }

  subscribe(handler: (message: EngineMessage) => void) {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  onStatusChange(handler: (status: TransportStatus) => void) {
    this.statusListeners.add(handler);
    return () => this.statusListeners.delete(handler);
  }

  private openSocket() {
    this.setStatus("connecting");
    let socket: WebSocket;
    try {
      socket = new WebSocket(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws = socket;

    socket.onopen = () => {
      this.reconnectAttempt = 0;
      this.setStatus("open");
      for (const message of this.queue.splice(0)) socket.send(JSON.stringify(message));
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as EngineMessage;
        for (const listener of this.listeners) listener(message);
      } catch {
        // Ignore malformed frames rather than crashing a live display.
      }
    };

    socket.onclose = () => {
      this.setStatus("closed");
      if (!this.explicitlyClosed) this.scheduleReconnect();
    };

    socket.onerror = () => {
      this.setStatus("error");
    };
  }

  private scheduleReconnect() {
    const delay = RECONNECT_DELAYS_MS[Math.min(this.reconnectAttempt, RECONNECT_DELAYS_MS.length - 1)];
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      if (!this.explicitlyClosed) this.openSocket();
    }, delay);
  }

  private setStatus(status: TransportStatus) {
    this.status = status;
    for (const listener of this.statusListeners) listener(status);
  }
}

let sharedTransport: RealtimeTransport | null = null;

/** One transport instance per browser tab, shared by every engine hook/component. */
export function getTransport(): RealtimeTransport {
  if (sharedTransport) return sharedTransport;
  const wsUrl = process.env.NEXT_PUBLIC_DISPLAY_ENGINE_WS_URL;
  sharedTransport = wsUrl ? new WebSocketTransport(wsUrl) : new BroadcastChannelTransport();
  return sharedTransport;
}
