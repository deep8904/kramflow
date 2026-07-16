"use client";

import { useWakeLock } from "@/lib/display-engine/use-fullscreen";
import { cn } from "@/lib/utils";

/**
 * Full-viewport shell for every Display Engine surface — full-bleed, fixed
 * safe-area margin, no browser chrome assumptions. Deliberately not the
 * existing components/tv/tv-layout.tsx: that component is scoped to the
 * two existing TV routes and changing it is out of bounds for this
 * branch. This is the new engine's own equivalent, same design-token
 * language, zero shared code with the untouched surfaces.
 */
export function DisplayShell({
  children,
  className,
  wakeLockEnabled = true,
}: {
  children: React.ReactNode;
  className?: string;
  wakeLockEnabled?: boolean;
}) {
  useWakeLock(wakeLockEnabled);

  return (
    <main className={cn("h-screen w-screen overflow-hidden bg-background flex flex-col", className)}>
      {/* min-h-0 is required here, not decorative: without it this flex
          item's default min-height:auto refuses to shrink below its
          content's natural height, so any unconstrained-length child (e.g.
          Volunteer/AV's full un-limited SessionTimeline) balloons this
          div's height instead of scrolling internally, and the overflow
          gets silently clipped by <main>'s overflow-hidden — content exists
          in the DOM, just rendered thousands of px below the visible
          viewport. Lobby's SessionTimeline happens to pass limit={8}, which
          kept it short enough to not visibly hit this; Green Room doesn't
          use SessionTimeline at all — both masked the same underlying bug. */}
      <div className="flex-1 min-h-0 flex flex-col justify-between" style={{ padding: "clamp(48px, 4vw, 64px)" }}>
        {children}
      </div>
    </main>
  );
}
