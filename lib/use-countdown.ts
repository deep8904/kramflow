"use client";

import { useEffect, useState } from "react";

interface CountdownResult {
  remainingSeconds: number;
  fraction: number; // elapsed / total, can exceed 1 on overrun
  isOverrun: boolean;
  label: string; // "mm:ss"
}

export function useCountdown(
  startedAt: string | null,
  durationMinutes: number,
  pausedAt: string | null = null
): CountdownResult {
  // `now` starts null so the first client render matches the server render
  // exactly (both show the static duration) — it's only set after mount,
  // avoiding a hydration mismatch from clock drift between server and client.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // Interval callback (not the effect body) is what calls setState, so the
    // first tick lands ~1s after mount — imperceptible for minutes-long cues.
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const totalSeconds = durationMinutes * 60;

  if (!startedAt || now === null) {
    return {
      remainingSeconds: totalSeconds,
      fraction: 0,
      isOverrun: false,
      label: formatDuration(totalSeconds),
    };
  }

  // While on hold, freeze the clock at the moment the hold began instead of
  // the live time, so every display's countdown stops in lockstep.
  const clockNow = pausedAt ? Date.parse(pausedAt) : now;
  const elapsedSeconds = Math.max(0, Math.floor((clockNow - Date.parse(startedAt)) / 1000));
  const remainingSeconds = totalSeconds - elapsedSeconds;
  const isOverrun = remainingSeconds < 0;

  return {
    remainingSeconds,
    fraction: totalSeconds > 0 ? elapsedSeconds / totalSeconds : 0,
    isOverrun,
    label: formatDuration(Math.abs(remainingSeconds)),
  };
}

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
