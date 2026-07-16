"use client";

import { ChevronLeft, Pause, Play, Square, ChevronRight } from "lucide-react";
import { useEventStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/tv/section-label";
import { JumpControl } from "./jump-control";
import { AlertComposer } from "./alert-composer";
import { ActivityLog } from "./activity-log";
import { OperatorBroadcastPanel } from "@/components/display-engine/operator-broadcast-panel";
import type { Session } from "@/lib/types";

export function ControlsPanel({ session }: { session: Session }) {
  const { state, start, next, previous, finish, togglePause } = useEventStore();
  const progress = state.progressBySession[state.activeSessionId];
  const currentOrder = progress?.currentOrder ?? null;
  const min = 1;
  const max = session.items.length;
  const isFinished = currentOrder !== null && currentOrder > max;

  return (
    <div className="flex flex-col gap-10">
      <div>
        <SectionLabel>Controls</SectionLabel>
        <div className="mt-3 flex flex-col gap-3">
          {currentOrder === null ? (
            <Button variant="primary" size="lg" className="w-full" onClick={start}>
              <Play className="h-5 w-5" strokeWidth={2} />
              Start
            </Button>
          ) : (
            <>
              {isFinished ? (
                <p className="text-body text-muted-2 py-2">Session finished.</p>
              ) : currentOrder === max ? (
                <Button variant="primary" size="lg" className="w-full" onClick={() => finish(max)}>
                  <Square className="h-5 w-5" strokeWidth={2} />
                  Finish
                </Button>
              ) : (
                <Button variant="primary" size="lg" className="w-full" onClick={() => next(max)}>
                  Next
                  <ChevronRight className="h-5 w-5" strokeWidth={2} />
                </Button>
              )}
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="md"
                  className="flex-1"
                  onClick={() => previous(min)}
                  disabled={currentOrder === min}
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  className="flex-1"
                  onClick={togglePause}
                  aria-label={state.pausedAt ? "Resume" : "Hold"}
                >
                  {state.pausedAt ? (
                    <Play className="h-4 w-4" strokeWidth={2} />
                  ) : (
                    <Pause className="h-4 w-4" strokeWidth={2} />
                  )}
                  {state.pausedAt ? "Resume" : "Hold"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="border-t border-white/5 pt-8">
        <JumpControl max={max} />
      </div>

      <div className="border-t border-white/5 pt-8">
        <AlertComposer />
      </div>

      <OperatorBroadcastPanel />

      <div className="border-t border-white/5 pt-8">
        <ActivityLog />
      </div>
    </div>
  );
}
