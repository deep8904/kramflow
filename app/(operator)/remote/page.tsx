"use client";

import { useRef, useState } from "react";
import { ChevronLeft, Pause, Play, Square, AlertTriangle, NotebookPen, Hash, X, Send, Lock, Megaphone } from "lucide-react";
import { useEventStore } from "@/lib/store";
import { useSessions } from "@/lib/use-sessions";
import { getSessionById } from "@/lib/data/sessions";
import { getLive, getNext } from "@/lib/types";
import { useCountdown } from "@/lib/use-countdown";
import { useAuth } from "@/components/auth/auth-context";
import { useDisplayEngine } from "@/lib/display-engine/store";
import { EMERGENCY_PRESETS } from "@/lib/display-engine/types";
import { ProgressBar } from "@/components/tv/progress-bar";
import { HoldBadge } from "@/components/tv/hold-badge";
import { BigActionButton } from "@/components/remote/big-action-button";
import { QuickActionButton } from "@/components/remote/quick-action-button";
import { ConfirmDialog, useConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

type Panel = "none" | "jump" | "alert" | "notes" | "broadcast";
type ConfirmKind = "start" | "finish" | { session: string; label: string } | { jump: number } | null;

export default function RemotePage() {
  const { state, selectSession, start, next, previous, finish, togglePause, jumpTo, setAlert, setNotes } =
    useEventStore();
  const { lock } = useAuth();
  const { sendBroadcast } = useDisplayEngine();
  const sessions = useSessions();
  const session = getSessionById(sessions, state.activeSessionId);
  const [panel, setPanel] = useState<Panel>("none");
  const [confirmKind, setConfirmKind] = useState<ConfirmKind>(null);
  const [pending, setPending] = useState<"next" | "previous" | "hold" | "start" | "finish" | null>(null);
  const runningRef = useRef(false);
  const emergencyConfirm = useConfirmDialog<(typeof EMERGENCY_PRESETS)[number]>();

  const progress = session ? state.progressBySession[state.activeSessionId] : undefined;
  const currentOrder = progress?.currentOrder ?? null;
  const live = session ? getLive(session, state) : null;
  const next_ = session ? getNext(session, state) : null;
  const countdown = useCountdown(progress?.startedAt ?? null, live?.durationMinutes ?? 0, state.pausedAt);
  const min = 1;
  const max = session?.items.length ?? 0;
  const isFinished = currentOrder !== null && currentOrder > max;
  const isLastItem = currentOrder === max;
  const currentSessionHasProgress = currentOrder !== null;

  async function run(kind: NonNullable<typeof pending>, action: () => Promise<unknown> | unknown) {
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

  function handleSessionClick(sessionId: string, label: string) {
    if (sessionId === state.activeSessionId) return;
    if (currentSessionHasProgress) {
      setConfirmKind({ session: sessionId, label });
    } else {
      selectSession(sessionId);
    }
  }

  if (!session) {
    return (
      <main className="h-screen w-screen flex items-center justify-center bg-background px-6 text-center">
        <p className="text-body text-muted">
          {sessions.length === 0 ? "No sessions yet — add one from the Operator dashboard." : "Select a session to get started."}
        </p>
      </main>
    );
  }

  return (
    <main className="h-screen w-screen overflow-hidden bg-background flex flex-col">
      {/* Compact header — session context, not a full navigation bar */}
      <div className="shrink-0 px-6 pt-6 pb-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] text-tertiary truncate min-w-0">
            {session.dayLabel} · {session.sessionLabel}
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <p className="text-[12px] text-tertiary tabular">
              {Math.min(currentOrder ?? 0, max)} / {max}
            </p>
            <button
              type="button"
              onClick={lock}
              aria-label="Lock"
              className="text-tertiary hover:text-primary cursor-pointer p-1 -m-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:ring-offset-1 focus-visible:ring-offset-background rounded-lg transition-colors"
            >
              <Lock className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto mt-3 pb-1 -mx-1 px-1">
          {sessions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSessionClick(s.id, `${s.dayLabel} ${s.sessionLabel}`)}
              aria-current={s.id === state.activeSessionId ? "true" : undefined}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-medium cursor-pointer transition-colors",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                s.id === state.activeSessionId ? "bg-surface-1 border border-[var(--color-border-strong)] text-primary" : "text-tertiary"
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
          <p className="text-[15px] text-tertiary">Not started</p>
        ) : isFinished ? (
          <p className="text-[15px] text-tertiary">Session finished</p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <p className="text-[10px] uppercase tracking-[0.14em] text-tertiary font-medium">Now</p>
              {state.pausedAt && <HoldBadge />}
            </div>
            <p className="text-[2rem] font-semibold text-primary mt-2 leading-tight tracking-tight text-balance">{live?.title}</p>
            {live?.presenter && <p className="text-[15px] text-secondary mt-1.5">{live.presenter}</p>}

            {live && live.type === "item" && live.durationMinutes > 0 && (
              <div className="mt-8 w-full max-w-xs">
                <p className="text-[5.25rem] font-semibold text-primary tabular tracking-tight leading-none">{countdown.label}</p>
                <div className="mt-4">
                  <ProgressBar
                    fraction={countdown.fraction}
                    tone={state.pausedAt ? "orange" : countdown.isOverrun ? "red" : "green"}
                  />
                </div>
              </div>
            )}

            {next_ && (
              <div className="mt-10 pt-6 border-t border-[var(--color-border)] w-full max-w-xs">
                <p className="text-[10px] uppercase tracking-[0.14em] text-tertiary font-medium">Next</p>
                <p className="text-[15px] text-secondary mt-1.5">{next_.title}</p>
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
            onRequestJump={(order) => {
              setConfirmKind({ jump: order });
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
            onBroadcast={(title, message) => {
              sendBroadcast({
                type: "info",
                title,
                message,
                icon: null,
                priority: 2,
                target: { kind: "all" },
                expiresInMinutes: null,
                durationSeconds: null,
                acknowledgementRequired: false,
                persistent: false,
                scheduledFor: null,
              });
              setPanel("none");
            }}
            onRequestEmergency={(preset) => {
              emergencyConfirm.request(preset);
              setPanel("none");
            }}
          />
        )}

        {currentOrder === null ? (
          <BigActionButton onClick={() => setConfirmKind("start")} className="h-24" disabled={pending !== null}>
            <Play className="h-7 w-7" strokeWidth={2} />
            Start
          </BigActionButton>
        ) : isFinished ? null : (
          <>
            <BigActionButton
              onClick={() => run("next", () => next(max))}
              className="h-28"
              disabled={isLastItem || pending !== null}
            >
              Next
            </BigActionButton>

            {isLastItem && (
              <BigActionButton
                variant="danger"
                className="h-16 mt-3"
                onClick={() => setConfirmKind("finish")}
                disabled={pending !== null}
              >
                <Square className="h-5 w-5" strokeWidth={2} />
                Finish Session
              </BigActionButton>
            )}

            <div className="flex gap-3 mt-3">
              <BigActionButton
                variant="secondary"
                className="h-16 text-base"
                onClick={() => run("previous", () => previous(min))}
                disabled={currentOrder === min || pending !== null}
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2} />
                Previous
              </BigActionButton>
              <BigActionButton
                variant={state.pausedAt ? "warning" : "secondary"}
                className="h-16 text-base"
                onClick={() => run("hold", togglePause)}
                disabled={pending !== null}
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
              <QuickActionButton
                icon={Megaphone}
                label="Broadcast"
                active={panel === "broadcast"}
                onClick={() => setPanel(panel === "broadcast" ? "none" : "broadcast")}
              />
            </div>
          </>
        )}
      </div>

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

      <ConfirmDialog
        open={typeof confirmKind === "object" && confirmKind !== null && "session" in confirmKind}
        title={`Switch to ${typeof confirmKind === "object" && confirmKind && "session" in confirmKind ? confirmKind.label : ""}?`}
        description="The current session has already started. Switching changes what's live on every connected display."
        confirmLabel="Switch Session"
        tone="danger"
        onConfirm={() => {
          if (typeof confirmKind === "object" && confirmKind && "session" in confirmKind) {
            selectSession(confirmKind.session);
          }
          setConfirmKind(null);
        }}
        onCancel={() => setConfirmKind(null)}
      />

      <ConfirmDialog
        open={typeof confirmKind === "object" && confirmKind !== null && "jump" in confirmKind}
        title={`Jump to item ${typeof confirmKind === "object" && confirmKind && "jump" in confirmKind ? confirmKind.jump : ""}?`}
        description="This changes what's live on every connected display right now."
        confirmLabel="Jump Here"
        onConfirm={() => {
          if (typeof confirmKind === "object" && confirmKind && "jump" in confirmKind) {
            jumpTo(confirmKind.jump);
          }
          setConfirmKind(null);
        }}
        onCancel={() => setConfirmKind(null)}
      />

      <ConfirmDialog
        open={emergencyConfirm.isOpen}
        title={`Send "${emergencyConfirm.pending?.title}" to every display?`}
        description="This takes over every connected screen immediately."
        confirmLabel="Send Emergency"
        tone="danger"
        onConfirm={() => {
          const preset = emergencyConfirm.pending;
          if (preset) {
            sendBroadcast({
              type: "emergency",
              title: preset.title,
              message: preset.message,
              icon: null,
              priority: 3,
              target: { kind: "all" },
              expiresInMinutes: null,
              durationSeconds: null,
              acknowledgementRequired: true,
              persistent: true,
              scheduledFor: null,
            });
          }
          emergencyConfirm.cancel();
        }}
        onCancel={emergencyConfirm.cancel}
      />
    </main>
  );
}

function QuickPanel({
  panel,
  onClose,
  max,
  currentNotes,
  onRequestJump,
  onAlert,
  onSaveNotes,
  onBroadcast,
  onRequestEmergency,
}: {
  panel: Exclude<Panel, "none">;
  onClose: () => void;
  max: number;
  currentNotes: string;
  onRequestJump: (order: number) => void;
  onAlert: (message: string, severity: "info" | "warning" | "critical") => void;
  onSaveNotes: (text: string) => void;
  onBroadcast: (title: string, message: string) => void;
  onRequestEmergency: (preset: (typeof EMERGENCY_PRESETS)[number]) => void;
}) {
  const [jumpValue, setJumpValue] = useState("");
  const [alertValue, setAlertValue] = useState("");
  const [notesValue, setNotesValue] = useState(currentNotes);
  const [broadcastValue, setBroadcastValue] = useState("");

  return (
    <div className="rounded-2xl bg-surface-1 border border-[var(--color-border)] p-5 mb-3">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-[0.14em] text-tertiary font-medium">
          {panel === "jump"
            ? "Jump to Item"
            : panel === "alert"
              ? "Send Alert"
              : panel === "notes"
                ? "Stage Notes"
                : "Broadcast to Displays"}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-tertiary hover:text-primary cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:ring-offset-1 focus-visible:ring-offset-background rounded-lg p-1 transition-colors"
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
            className="flex-1 h-14 rounded-xl bg-surface-2 border border-[var(--color-border)] px-4 text-xl tabular text-primary outline-none focus:border-[var(--color-border-strong)] focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:ring-offset-1 focus-visible:ring-offset-background transition-colors"
          />
          <button
            type="button"
            aria-label="Jump"
            className="h-14 w-14 rounded-xl bg-primary text-background flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            disabled={!jumpValue || Number(jumpValue) < 1 || Number(jumpValue) > max}
            onClick={() => onRequestJump(Number(jumpValue))}
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
            className="flex-1 rounded-xl bg-surface-2 border border-[var(--color-border)] px-4 py-3 text-[15px] text-primary outline-none focus:border-[var(--color-border-strong)] focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:ring-offset-1 focus-visible:ring-offset-background resize-none transition-colors placeholder:text-tertiary"
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

      {panel === "broadcast" && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Message to every display"
              value={broadcastValue}
              onChange={(e) => setBroadcastValue(e.target.value)}
              aria-label="Broadcast message"
            className="flex-1 h-14 rounded-xl bg-surface-2 border border-[var(--color-border)] px-4 text-[15px] text-primary outline-none focus:border-[var(--color-border-strong)] focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:ring-offset-1 focus-visible:ring-offset-background transition-colors placeholder:text-tertiary"
            />
            <button
              type="button"
              aria-label="Send broadcast"
              className="h-14 w-14 rounded-xl bg-primary text-background flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              disabled={!broadcastValue.trim()}
              onClick={() => onBroadcast(broadcastValue.trim(), "")}
            >
              <Send className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {EMERGENCY_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => onRequestEmergency(preset)}
                className="flex items-center gap-1.5 rounded-lg bg-status-red/10 border border-status-red/20 text-status-red px-3 py-1.5 text-[11px] font-semibold cursor-pointer hover:bg-status-red/18 transition-colors"
              >
                <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
