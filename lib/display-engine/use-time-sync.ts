"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SAMPLE_COUNT = 5;
const RESYNC_INTERVAL_MS = 5 * 60 * 1000;

interface TimeSyncResult {
  /** Milliseconds to add to Date.now() to get the server's clock. */
  offsetMs: number;
  /** Estimated one-way network latency from the best sample, in ms. */
  latencyMs: number | null;
  syncedAt: number | null;
}

async function sampleOnce(): Promise<{ offsetMs: number; roundTripMs: number } | null> {
  const t0 = Date.now();
  try {
    const res = await fetch("/api/display-engine/time", { cache: "no-store" });
    const t1 = Date.now();
    const { serverTime } = (await res.json()) as { serverTime: number };
    const roundTripMs = t1 - t0;
    // Cristian's algorithm: assume the request and response legs took
    // roughly equal time, so the server's clock at t1 was serverTime +
    // half the round trip.
    const estimatedServerNow = serverTime + roundTripMs / 2;
    return { offsetMs: estimatedServerNow - t1, roundTripMs };
  } catch {
    return null;
  }
}

/**
 * Estimates the offset between this device's clock and the server's, so
 * every connected display agrees on "now" even if a device's system clock
 * has drifted. Not cryptographically rigorous — just enough to keep
 * countdowns visually in lockstep across a room of TVs.
 */
export function useTimeSync(): TimeSyncResult & { resync: () => void } {
  const [result, setResult] = useState<TimeSyncResult>({ offsetMs: 0, latencyMs: null, syncedAt: null });
  const runningRef = useRef(false);

  const resync = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;

    (async () => {
      const samples: { offsetMs: number; roundTripMs: number }[] = [];
      for (let i = 0; i < SAMPLE_COUNT; i++) {
        const sample = await sampleOnce();
        if (sample) samples.push(sample);
      }
      runningRef.current = false;
      if (samples.length === 0) return;
      const best = samples.reduce((a, b) => (b.roundTripMs < a.roundTripMs ? b : a));
      setResult({ offsetMs: best.offsetMs, latencyMs: best.roundTripMs / 2, syncedAt: Date.now() });
    })();
  }, []);

  useEffect(() => {
    resync();
    const interval = setInterval(resync, RESYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [resync]);

  return { ...result, resync };
}

/** Given an offset from useTimeSync(), returns the current server-synced timestamp. */
export function syncedNow(offsetMs: number): number {
  return Date.now() + offsetMs;
}
