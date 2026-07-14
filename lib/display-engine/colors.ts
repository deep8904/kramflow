import type { TimerColorState } from "./types";

/**
 * Timer color escalation. Green/orange/red reuse the exact hex values
 * already defined in app/globals.css (--color-green / --color-orange /
 * --color-red) so a Presenter Display reads as unmistakably "the same
 * product" as the rest of KramFlow. Yellow is new — the rest of the app
 * doesn't need a 5-step color ramp, but a confidence monitor genuinely
 * does (this is the one deliberate, documented exception to "one accent
 * color" — see docs/DISPLAY_ENGINE.md). Contrast-checked at 9.85:1 against
 * the shared #0F1115 background, same bar as every other status color.
 */
export const TIMER_COLORS: Record<TimerColorState, string> = {
  green: "#22c55e",
  yellow: "#eab308",
  orange: "#f59e0b",
  red: "#ef4444",
  critical: "#ef4444",
};

export const TIMER_COLOR_LABELS: Record<TimerColorState, string> = {
  green: "On time",
  yellow: "Approaching end",
  orange: "Final minute",
  red: "Overtime",
  critical: "Critical overtime",
};
