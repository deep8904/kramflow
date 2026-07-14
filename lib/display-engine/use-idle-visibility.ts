"use client";

import { useEffect, useState } from "react";

/**
 * Tracks whether the operator has interacted recently, so a display's own
 * controls (never meant to be permanently on screen for a presenter or
 * audience-facing display) can fade in on activity and fade back out after
 * a period of idle time — the same "controls auto-hide" convention video
 * players and professional playout software use, without borrowing any of
 * their visual design.
 */
export function useIdleVisibility(idleAfterMs = 4000): boolean {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const reveal = () => {
      setVisible(true);
      clearTimeout(timer);
      timer = setTimeout(() => setVisible(false), idleAfterMs);
    };
    reveal();
    window.addEventListener("mousemove", reveal);
    window.addEventListener("keydown", reveal);
    window.addEventListener("touchstart", reveal);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", reveal);
      window.removeEventListener("keydown", reveal);
      window.removeEventListener("touchstart", reveal);
    };
  }, [idleAfterMs]);

  return visible;
}
