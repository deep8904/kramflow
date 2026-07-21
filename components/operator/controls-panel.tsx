"use client";

import { useRef, useState } from "react";
import { ChevronLeft, Pause, Play, Square, ChevronRight } from "lucide-react";
import { useEventStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { JumpControl } from "./jump-control";
import { AlertComposer } from "./alert-composer";
import { ActivityLog } from "./activity-log";
import { OperatorBroadcastPanel } from "@/components/display-engine/operator-broadcast-panel";
import type { Session } from "@/lib/types";

type ConfirmKind = "start" | "finish" | null;

export function ControlsPanel({ session }: { session: Session }) {
  const { state, start, next, previous, finish, togglePause } = useEventStore();
  const progress = state.progressBySession[state.activeSessionId];
  const currentOrder = progress?.currentOrder ?? null;
  const min = 1;
  const max = session.items.length;
  const isFinished = currentOrder !== null && currentOrder > max;
  const isLastItem = currentOrder === max;

  const [confirmKind, setConfirmKind] = useState<ConfirmKind>(null);
  const [pending, setPending] = useState<
    "next" | "previous" | "hold" | "start" | "finish" | null
  >(null);
  const runningRef = useRef(false);

  async function run(
    kind: NonNullable<typeof pending>,
    action: () => Promise<unknown> | unknown
  ) {
    if (runningRef.current) return;
    runningRef.current = true;
    setPending(kind);
    try {
      await action();
    } finally {
      runningRef.current = false;
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* ── Transport controls ─────────────────────────────────── */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.14em] text-tertiary font-medium mb-3">
          Controls
        </p>

        <div className="flex flex-col gap-2.5">
          {currentOrder === null ? (
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              disabled={pending !== null}
              onClick={() => setConfirmKind("start")}
            >
              <Play className="h-5 w-5" strokeWidth={1.5} />
              Start Session
            </Button>
          ) : (
            <>
              {isFinished ? (
                <div className="rounded-xl bg-surface-1 border border-[var(--color-border)] px-4 py-3 text-center">
                  <p className="text-[13px] text-tertiary">Session finished</p>
                </div>
              ) : (
                <>
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    disabled={isLastItem || pending !== null}
                    onClick={() => run("next", () => next(max))}
                  >
                    Next
                    <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
                  </Button>
                  {isLastItem && (
                    <Button
                      variant="danger"
                      size="lg"
                      className="w-full"
                      disabled={pending !== null}
                      onClick={() => setConfirmKind("finish")}
                    >
                      <Square className="h-4 w-4" strokeWidth={1.5} />
                      Finish Session
                    </Button>
                  )}
                </>
              )}

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  className="flex-1"
                  onClick={() => run("previous", () => previous(min))}
                  disabled={currentOrder === min || pending !== null}
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  className="flex-1"
                  onClick={() => run("hold", togglePause)}
                  disabled={pending !== null}
                  aria-label={state.pausedAt ? "Resume" : "Hold"}
                >
                  {state.pausedAt ? (
                    <Play className="h-4 w-4" strokeWidth={1.5} />
                  ) : (
                    <Pause className="h-4 w-4" strokeWidth={1.5} />
                  )}
                  {state.pausedAt ? "Resume" : "Hold"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Jump ───────────────────────────────────────────────── */}
      <div className="border-t border-[var(--color-border)] pt-6">
        <JumpControl max={max} />
      </div>

      {/* ── Alert ──────────────────────────────────────────────── */}
      <div className="border-t border-[var(--color-border)] pt-6">
        <AlertComposer />
      </div>

      {/* ── Broadcasts ─────────────────────────────────────────── */}
      <OperatorBroadcastPanel />

      {/* ── Activity ───────────────────────────────────────────── */}
      <div className="border-t border-[var(--color-border)] pt-6">
        <ActivityLog />
      </div>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={confirmKind === "start"}
        title="Start the session?"
        description="This puts the first item live on every connected display."
        confirmLabel="Start"
        onConfirm={() => {
          setConfirmKind(null);
          run("start", start);
        }}
        onCancel={() => setConfirmKind(null)}
      />

      <ConfirmDialog
        open={confirmKind === "finish"}
        title="Finish the session?"
        description="This marks the session complete on every connected display. You can still use Previous to go back."
        confirmLabel="Finish Session"
        tone="danger"
        onConfirm={() => {
          setConfirmKind(null);
          run("finish", () => finish(max));
        }}
        onCancel={() => setConfirmKind(null)}
      />
    </div>
  );
}
