"use client";

import { useState } from "react";
import { getLive, type Session } from "@/lib/types";
import { useEventStore } from "@/lib/store";
import { useCountdown } from "@/lib/use-countdown";
import { ProgressBar } from "@/components/tv/progress-bar";
import { HoldBadge } from "@/components/tv/hold-badge";
import { Button } from "@/components/ui/button";

export function LiveDetailsPanel({ session }: { session: Session }) {
  const { state, setNotes } = useEventStore();
  const live = getLive(session, state);
  const progress = state.progressBySession[state.activeSessionId];
  const currentOrder = progress?.currentOrder ?? null;
  const countdown = useCountdown(
    progress?.startedAt ?? null,
    live?.durationMinutes ?? 0,
    state.pausedAt
  );
  const isFinished =
    currentOrder !== null && currentOrder > session.items.length;

  const [draft, setDraft] = useState(live?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const notesKey = `${live?.id ?? ""}:${live?.notes ?? ""}`;
  const [trackedNotesKey, setTrackedNotesKey] = useState(notesKey);
  if (notesKey !== trackedNotesKey) {
    setTrackedNotesKey(notesKey);
    setDraft(live?.notes ?? "");
  }

  if (currentOrder === null || isFinished || !live) {
    return (
      <div className="h-full flex items-center">
        <p className="text-[13px] text-tertiary">
          {isFinished
            ? "Session finished."
            : "Press Start to begin the program."}
        </p>
      </div>
    );
  }

  const dirty = draft !== (live.notes ?? "");

  async function handleSave() {
    if (!live) return;
    setSaving(true);
    try {
      await setNotes(live.id, draft);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full gap-0">
      {/* Section label */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-[10px] uppercase tracking-[0.14em] text-tertiary font-medium">
          Live Now
        </p>
        {state.pausedAt && <HoldBadge />}
      </div>

      {/* Current item */}
      <div className="bg-surface-1 border border-[var(--color-border)] rounded-xl p-4">
        {live.kicker && (
          <p className="text-[10px] uppercase tracking-wider text-tertiary mb-1">
            {live.kicker}
          </p>
        )}
        <p className="text-[17px] font-semibold text-primary leading-snug">
          {live.title}
        </p>
        {live.presenter && (
          <p className="text-[13px] text-secondary mt-1.5">{live.presenter}</p>
        )}

        {/* Countdown */}
        {live.type === "item" && live.durationMinutes > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
            <div className="flex items-baseline justify-between mb-2.5">
              <p
                className={cn(
                  "text-[2.75rem] leading-none font-semibold tabular tracking-tight",
                  state.pausedAt
                    ? "text-status-orange"
                    : countdown.isOverrun
                      ? "text-status-red"
                      : "text-primary"
                )}
              >
                {countdown.label}
              </p>
              <p className="text-[11px] text-tertiary">
                {countdown.isOverrun ? "overrun" : "remaining"}
              </p>
            </div>
            <ProgressBar
              fraction={countdown.fraction}
              tone={
                state.pausedAt
                  ? "orange"
                  : countdown.isOverrun
                    ? "red"
                    : "green"
              }
            />
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="mt-5 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-tertiary font-medium">
            Stage Notes
          </p>
          {dirty && (
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          )}
        </div>
        <textarea
          key={live.id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Cues, mic setup, entrances, timing notes…"
          aria-label="Stage notes"
          className="w-full flex-1 min-h-24 rounded-xl bg-surface-1 border border-[var(--color-border)] px-4 py-3 text-[13px] text-primary placeholder:text-tertiary outline-none focus:border-[var(--color-border-strong)] focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:ring-offset-1 focus-visible:ring-offset-background resize-none transition-colors"
        />
      </div>
    </div>
  );
}

// cn is not imported at the top of this file, import here inline
function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
