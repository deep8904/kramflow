"use client";

import { useCallback, useEffect, useState } from "react";

const PREFERENCE_KEY = "kramflow.display-engine.fullscreen-preference";

/**
 * Real Fullscreen API usage — feature-detected, with the preference
 * remembered across reloads (a Presenter Display that was fullscreen
 * before a refresh should offer to go straight back rather than making
 * an operator re-trigger it every time, since fullscreen can only be
 * *entered* from a genuine user gesture — browsers block calling
 * requestFullscreen() automatically on page load).
 */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [wantsFullscreen, setWantsFullscreen] = useState(false);

  useEffect(() => {
    // Deferred into a callback (not called directly in the effect body) —
    // same pattern as the ticking interval in use-display-timer.ts.
    const id = setTimeout(() => {
      setIsSupported(typeof document !== "undefined" && Boolean(document.documentElement.requestFullscreen));
      setWantsFullscreen(window.localStorage.getItem(PREFERENCE_KEY) === "1");
      setIsFullscreen(Boolean(document.fullscreenElement));
    }, 0);

    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => {
      clearTimeout(id);
      document.removeEventListener("fullscreenchange", onChange);
    };
  }, []);

  const enter = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      window.localStorage.setItem(PREFERENCE_KEY, "1");
      setWantsFullscreen(true);
    } catch {
      // Fullscreen can be denied (no user gesture, permissions policy, etc.) — fail quietly, the display still works windowed.
    }
  }, []);

  const exit = useCallback(async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // ignore
      }
    }
    window.localStorage.setItem(PREFERENCE_KEY, "0");
    setWantsFullscreen(false);
  }, []);

  const toggle = useCallback(() => {
    if (isFullscreen) void exit();
    else void enter();
  }, [isFullscreen, enter, exit]);

  return { isFullscreen, isSupported, wantsFullscreen, enter, exit, toggle };
}

/**
 * Screen Wake Lock API — keeps the display from dimming/sleeping while a
 * production display is on screen. Feature-detected; silently a no-op on
 * browsers/contexts that don't support it (e.g. non-HTTPS, some embedded
 * TV browsers) rather than throwing.
 */
export function useWakeLock(enabled: boolean) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    async function acquire() {
      try {
        sentinel = await navigator.wakeLock.request("screen");
        if (cancelled) {
          await sentinel.release();
          return;
        }
        setIsActive(true);
        sentinel.addEventListener("release", () => setIsActive(false));
      } catch {
        setIsActive(false);
      }
    }

    void acquire();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && !sentinel) void acquire();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      void sentinel?.release();
    };
  }, [enabled]);

  return isActive;
}
