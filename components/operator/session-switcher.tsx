"use client";

import { sessions } from "@/lib/cuesheet";
import { useEventStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function SessionSwitcher() {
  const { state, selectSession } = useEventStore();

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
            className={cn(
              "shrink-0 rounded-lg px-3 py-2 text-left transition-colors cursor-pointer",
              active ? "bg-card" : "hover:bg-card/60"
            )}
          >
            <span className="flex items-center gap-1.5">
              <span className={cn("text-caption font-medium", active ? "text-primary" : "text-muted")}>
                {s.dayLabel}
              </span>
              {isLive && <span className="h-1.5 w-1.5 rounded-full bg-status-green" />}
            </span>
            <p className={cn("text-caption", active ? "text-muted" : "text-muted-2")}>{s.sessionLabel}</p>
          </button>
        );
      })}
    </div>
  );
}
