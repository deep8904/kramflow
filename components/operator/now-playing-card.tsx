"use client";

import { ChevronLeft, ChevronRight, Pause, Play, Square } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEventStore } from "@/lib/store";
import { audioSummary, getLive, lightingSummary, videoSummary, type Session } from "@/lib/types";
import { useCountdown } from "@/lib/use-countdown";
import { ProgressBar } from "@/components/tv/progress-bar";
import { HoldBadge } from "@/components/tv/hold-badge";

export function NowPlayingCard({ session }: { session: Session }) {
  const { state, start, next, previous, finish, togglePause } = useEventStore();
  const live = getLive(session, state);
  const progress = state.progressBySession[state.activeSessionId];
  const currentOrder = progress?.currentOrder ?? null;
  const countdown = useCountdown(progress?.startedAt ?? null, live?.durationMinutes ?? 0, state.pausedAt);

  const min = 1;
  const max = session.items.length;
  const isFinished = currentOrder !== null && currentOrder > max;

  if (currentOrder === null) {
    return (
      <Card className="flex items-center justify-between">
        <div>
          <p className="text-caption uppercase tracking-wide text-muted-2">Program</p>
          <p className="text-subtitle text-primary mt-1">Not started</p>
        </div>
        <Button variant="primary" onClick={start}>
          <Play className="h-4 w-4" strokeWidth={2} />
          Start
        </Button>
      </Card>
    );
  }

  if (isFinished) {
    return (
      <Card>
        <p className="text-caption uppercase tracking-wide text-muted-2">Program</p>
        <p className="text-subtitle text-primary mt-1">Finished</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center gap-2">
        <p className="text-caption uppercase tracking-wide text-muted-2">Live Now</p>
        {state.pausedAt && <HoldBadge />}
      </div>
      {live?.kicker && <p className="text-caption text-muted-2 mt-1.5">{live.kicker}</p>}
      <p className="text-subtitle text-primary mt-1 truncate">{live?.title}</p>
      {live?.presenter && <p className="text-body text-muted mt-1">{live.presenter}</p>}

      {live && live.type === "item" && live.durationMinutes > 0 && (
        <div className="mt-5">
          <ProgressBar
            fraction={countdown.fraction}
            tone={state.pausedAt ? "orange" : countdown.isOverrun ? "red" : "green"}
          />
          <p className="text-caption text-muted mt-2 tabular-nums">
            {countdown.isOverrun ? `${countdown.label} over` : `${countdown.label} remaining`}
          </p>
        </div>
      )}

      {live && live.type === "item" && (
        <div className="mt-5 flex flex-col gap-1 text-caption text-muted">
          <span>Audio: {audioSummary(live.audio)}</span>
          <span>Video: {videoSummary(live.video)}</span>
          {lightingSummary(live.lights) && <span>{lightingSummary(live.lights)}</span>}
        </div>
      )}

      <div className="flex items-center gap-2 mt-6">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => previous(min)}
          disabled={currentOrder === min}
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={togglePause}
          aria-label={state.pausedAt ? "Resume" : "Hold"}
        >
          {state.pausedAt ? <Play className="h-4 w-4" strokeWidth={2} /> : <Pause className="h-4 w-4" strokeWidth={2} />}
        </Button>
        {currentOrder === max ? (
          <Button variant="secondary" size="sm" onClick={() => finish(max)} className="flex-1">
            <Square className="h-4 w-4" strokeWidth={2} />
            Finish
          </Button>
        ) : (
          <Button variant="primary" size="sm" onClick={() => next(max)} className="flex-1">
            Next
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </Button>
        )}
      </div>
    </Card>
  );
}
