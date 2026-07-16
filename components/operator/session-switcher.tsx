"use client";

import { useSessions } from "@/lib/use-sessions";
import { useEventStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function SessionSwitcher() {
  const { state, selectSession } = useEventStore();
  const sessions = useSessions();

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {sessions.map((s) => {
        const active = s.id === state.activeSessionId;
        const progress = state.progressBySession[s.id];
        const isLive = progress && progress.currentOrder !== null && progress.currentOrder <= s.items.length;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => selectSession(s.id)}
            aria-current={active ? "true" : undefined}
            aria-label={`${s.dayLabel} ${s.sessionLabel}${isLive ? " (in progress)" : ""}`}
            className={cn(
              "shrink-0 rounded-lg px-3 py-2 text-left transition-colors cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              active ? "bg-card" : "hover:bg-card/60"
            )}
          >
            <span className="flex items-center gap-1.5">
              <span className={cn("text-caption font-medium", active ? "text-primary" : "text-muted")}>
                {s.dayLabel}
              </span>
              {isLive && <span className="h-1.5 w-1.5 rounded-full bg-status-green" aria-hidden="true" />}
            </span>
            <p className={cn("text-caption", active ? "text-muted" : "text-muted-2")}>{s.sessionLabel}</p>
          </button>
        );
      })}
    </div>
  );
}
