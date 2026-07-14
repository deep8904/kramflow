"use client";

import { useEffect, useRef } from "react";

export interface ShortcutMap {
  [key: string]: (event: KeyboardEvent) => void;
}

/**
 * Scoped keyboard shortcuts for a single display-engine page. Never
 * attached globally — each page opts in explicitly, so this has zero
 * effect on the existing app's own keyboard handling.
 */
export function useKeyboardShortcuts(map: ShortcutMap, enabled = true) {
  const mapRef = useRef(map);
  useEffect(() => {
    mapRef.current = map;
  });

  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(event: KeyboardEvent) {
      // Don't hijack typing in an input/textarea.
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;

      const key = event.key === " " ? "Space" : event.key;
      const handler = mapRef.current[key];
      if (handler) {
        event.preventDefault();
        handler(event);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
