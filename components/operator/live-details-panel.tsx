"use client";

import { getLive, type Session } from "@/lib/types";
import { useEventStore } from "@/lib/store";
import { useCountdown } from "@/lib/use-countdown";
import { ProgressBar } from "@/components/tv/progress-bar";
import { HoldBadge } from "@/components/tv/hold-badge";
import { SectionLabel } from "@/components/tv/section-label";

export function LiveDetailsPanel({ session }: { session: Session }) {
  const { state, setNotes } = useEventStore();
  const live = getLive(session, state);
  const progress = state.progressBySession[state.activeSessionId];
  const currentOrder = progress?.currentOrder ?? null;
  const countdown = useCountdown(progress?.startedAt ?? null, live?.durationMinutes ?? 0, state.pausedAt);
  const isFinished = currentOrder !== null && currentOrder > session.items.length;

  if (currentOrder === null || isFinished || !live) {
    return (
      <div className="h-full flex items-center">
        <p className="text-body text-muted-2">
          {isFinished ? "Session finished." : "Press Start to begin the program."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2">
        <SectionLabel>Live Now</SectionLabel>
        {state.pausedAt && <HoldBadge />}
      </div>

      {live.kicker && <p className="text-caption text-muted-2 mt-3">{live.kicker}</p>}
      <p className="text-subtitle text-primary mt-1">{live.title}</p>
      {live.presenter && <p className="text-body text-muted mt-2">{live.presenter}</p>}

      {live.type === "item" && live.durationMinutes > 0 && (
        <div className="mt-8">
          <p className="text-[3rem] leading-none font-semibold text-primary tabular-nums">
            {countdown.label}
          </p>
          <div className="mt-3">
            <ProgressBar
              fraction={countdown.fraction}
              tone={state.pausedAt ? "orange" : countdown.isOverrun ? "red" : "green"}
            />
          </div>
          <p className="text-caption text-muted mt-2">
            {countdown.isOverrun ? "over" : "remaining"}
          </p>
        </div>
      )}

      <div className="mt-10 flex-1 flex flex-col min-h-0">
        <SectionLabel>Notes</SectionLabel>
        <textarea
          key={live.id}
          defaultValue={live.notes ?? ""}
          onBlur={(e) => setNotes(live.id, e.target.value)}
          placeholder="Stage notes — cues, mic setup, entrances…"
          aria-label="Stage notes"
          className="mt-3 w-full flex-1 min-h-24 rounded-lg bg-card border border-white/10 px-4 py-3 text-body text-primary placeholder:text-muted-2 outline-none focus:border-white/25 focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background resize-none"
        />
      </div>
    </div>
  );
}
