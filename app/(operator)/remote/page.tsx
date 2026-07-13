"use client";

import { useState } from "react";
import { ChevronLeft, Pause, Play, AlertTriangle, NotebookPen, Hash, X, Send, Lock } from "lucide-react";
import { useEventStore } from "@/lib/store";
import { getSessionById, sessions } from "@/lib/cuesheet";
import { getLive, getNext } from "@/lib/types";
import { useCountdown } from "@/lib/use-countdown";
import { useAuth } from "@/components/auth/auth-context";
import { ProgressBar } from "@/components/tv/progress-bar";
import { HoldBadge } from "@/components/tv/hold-badge";
import { BigActionButton } from "@/components/remote/big-action-button";
import { QuickActionButton } from "@/components/remote/quick-action-button";
import { cn } from "@/lib/utils";

type Panel = "none" | "jump" | "alert" | "notes";

export default function RemotePage() {
  const { state, selectSession, start, next, previous, finish, togglePause, jumpTo, setAlert, setNotes } =
    useEventStore();
  const { lock } = useAuth();
  const session = getSessionById(state.activeSessionId);
  const [panel, setPanel] = useState<Panel>("none");

  const progress = session ? state.progressBySession[state.activeSessionId] : undefined;
  const currentOrder = progress?.currentOrder ?? null;
  const live = session ? getLive(session, state) : null;
  const next_ = session ? getNext(session, state) : null;
  const countdown = useCountdown(progress?.startedAt ?? null, live?.durationMinutes ?? 0, state.pausedAt);
  const min = 1;
  const max = session?.items.length ?? 0;
  const isFinished = currentOrder !== null && currentOrder > max;

  if (!session) {
    return (
      <main className="h-screen w-screen flex items-center justify-center bg-background">
        <p className="text-body text-muted">No session found.</p>
      </main>
    );
  }

  return (
    <main className="h-screen w-screen overflow-hidden bg-background flex flex-col">
      {/* Compact header — session context, not a full navigation bar */}
      <div className="shrink-0 px-6 pt-6 pb-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-caption text-muted-2 truncate min-w-0">
            {session.dayLabel} • {session.sessionLabel}
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <p className="text-caption text-muted-2 tabular-nums">
              {Math.min(currentOrder ?? 0, max)} / {max}
            </p>
            <button
              type="button"
              onClick={lock}
              aria-label="Lock"
              className="text-muted-2 hover:text-primary cursor-pointer p-1 -m-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
            >
              <Lock className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto mt-3 pb-1 -mx-1 px-1">
          {sessions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => selectSession(s.id)}
              aria-current={s.id === state.activeSessionId ? "true" : undefined}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-caption font-medium cursor-pointer transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                s.id === state.activeSessionId ? "bg-card text-primary" : "text-muted-2"
              )}
            >
              {s.dayLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Main focus — current + next, huge countdown */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-6 text-center overflow-y-auto">
        {currentOrder === null ? (
          <p className="text-body text-muted">Not started</p>
        ) : isFinished ? (
          <p className="text-body text-muted">Session finished</p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <p className="text-caption uppercase tracking-wide text-muted-2">Now</p>
              {state.pausedAt && <HoldBadge />}
            </div>
            <p className="text-title text-primary mt-2 leading-tight">{live?.title}</p>
            {live?.presenter && <p className="text-body text-muted mt-1">{live.presenter}</p>}

            {live && live.type === "item" && live.durationMinutes > 0 && (
              <div className="mt-8 w-full max-w-xs">
                <p className="text-hero text-primary tabular-nums">{countdown.label}</p>
                <div className="mt-4">
                  <ProgressBar
                    fraction={countdown.fraction}
                    tone={state.pausedAt ? "orange" : countdown.isOverrun ? "red" : "green"}
                  />
                </div>
              </div>
            )}

            {next_ && (
              <div className="mt-10 pt-6 border-t border-white/5 w-full max-w-xs">
                <p className="text-caption uppercase tracking-wide text-muted-2">Next</p>
                <p className="text-body text-primary mt-1.5">{next_.title}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Thumb zone — primary controls stay fixed at the bottom */}
      <div className="shrink-0 px-6 pb-8 pt-4">
        {panel !== "none" && (
          <QuickPanel
            panel={panel}
            onClose={() => setPanel("none")}
            max={max}
            currentNotes={live?.notes ?? ""}
            onJump={(order) => {
              jumpTo(order);
              setPanel("none");
            }}
            onAlert={(message, severity) => {
              setAlert({ message, severity });
              setPanel("none");
            }}
            onSaveNotes={(text) => {
              if (live) setNotes(live.id, text);
              setPanel("none");
            }}
          />
        )}

        {currentOrder === null ? (
          <BigActionButton onClick={start} className="h-24">
            <Play className="h-7 w-7" strokeWidth={2} />
            Start
          </BigActionButton>
        ) : isFinished ? null : (
          <>
            <BigActionButton
              onClick={() => (currentOrder === max ? finish(max) : next(max))}
              className="h-28"
            >
              {currentOrder === max ? "Finish" : "Next"}
            </BigActionButton>

            <div className="flex gap-3 mt-3">
              <BigActionButton
                variant="secondary"
                className="h-16 text-base"
                onClick={() => previous(min)}
                disabled={currentOrder === min}
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2} />
                Previous
              </BigActionButton>
              <BigActionButton
                variant={state.pausedAt ? "warning" : "secondary"}
                className="h-16 text-base"
                onClick={togglePause}
              >
                {state.pausedAt ? <Play className="h-5 w-5" strokeWidth={2} /> : <Pause className="h-5 w-5" strokeWidth={2} />}
                {state.pausedAt ? "Resume" : "Hold"}
              </BigActionButton>
            </div>

            <div className="flex gap-3 mt-3">
              <QuickActionButton
                icon={Hash}
                label="Jump"
                active={panel === "jump"}
                onClick={() => setPanel(panel === "jump" ? "none" : "jump")}
              />
              <QuickActionButton
                icon={AlertTriangle}
                label="Alert"
                active={panel === "alert"}
                onClick={() => setPanel(panel === "alert" ? "none" : "alert")}
              />
              <QuickActionButton
                icon={NotebookPen}
                label="Notes"
                active={panel === "notes"}
                onClick={() => setPanel(panel === "notes" ? "none" : "notes")}
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function QuickPanel({
  panel,
  onClose,
  max,
  currentNotes,
  onJump,
  onAlert,
  onSaveNotes,
}: {
  panel: Exclude<Panel, "none">;
  onClose: () => void;
  max: number;
  currentNotes: string;
  onJump: (order: number) => void;
  onAlert: (message: string, severity: "info" | "warning" | "critical") => void;
  onSaveNotes: (text: string) => void;
}) {
  const [jumpValue, setJumpValue] = useState("");
  const [alertValue, setAlertValue] = useState("");
  const [notesValue, setNotesValue] = useState(currentNotes);

  return (
    <div className="rounded-2xl bg-card p-5 mb-3">
      <div className="flex items-center justify-between mb-3">
        <p className="text-caption uppercase tracking-wide text-muted-2">
          {panel === "jump" ? "Jump to Item" : panel === "alert" ? "Send Alert" : "Stage Notes"}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
          aria-label="Close"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      {panel === "jump" && (
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            max={max}
            inputMode="numeric"
            placeholder={`1–${max}`}
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            aria-label="Item number"
            className="flex-1 h-14 rounded-xl bg-background border border-white/10 px-4 text-xl tabular-nums text-primary outline-none focus:border-white/25 focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
          <button
            type="button"
            aria-label="Jump"
            className="h-14 w-14 rounded-xl bg-primary text-background flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            disabled={!jumpValue || Number(jumpValue) < 1 || Number(jumpValue) > max}
            onClick={() => onJump(Number(jumpValue))}
          >
            <Send className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
      )}

      {panel === "alert" && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Drama Team, report Stage Left"
            value={alertValue}
            onChange={(e) => setAlertValue(e.target.value)}
            aria-label="Alert message"
            className="flex-1 h-14 rounded-xl bg-background border border-white/10 px-4 text-body text-primary outline-none focus:border-white/25 focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
          <button
            type="button"
            aria-label="Send alert"
            className="h-14 w-14 rounded-xl bg-primary text-background flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            disabled={!alertValue.trim()}
            onClick={() => onAlert(alertValue.trim(), "warning")}
          >
            <Send className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
      )}

      {panel === "notes" && (
        <div className="flex gap-2">
          <textarea
            rows={2}
            placeholder="Cues, mic setup, entrances…"
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            aria-label="Stage notes"
            className="flex-1 rounded-xl bg-background border border-white/10 px-4 py-3 text-body text-primary outline-none focus:border-white/25 focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background resize-none"
          />
          <button
            type="button"
            aria-label="Save notes"
            className="h-14 w-14 rounded-xl bg-primary text-background flex items-center justify-center shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={() => onSaveNotes(notesValue)}
          >
            <Send className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  );
}
