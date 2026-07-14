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
      <div className="flex-1 flex flex-col justify-between" style={{ padding: "clamp(48px, 4vw, 64px)" }}>
        {children}
      </div>
    </main>
  );
}
