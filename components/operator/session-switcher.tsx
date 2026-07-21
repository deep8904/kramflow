"use client";

import { useSessions } from "@/lib/use-sessions";
import { useEventStore } from "@/lib/store";
import { ConfirmDialog, useConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

export function SessionSwitcher() {
  const { state, selectSession } = useEventStore();
  const sessions = useSessions();
  const switchConfirm = useConfirmDialog<{ id: string; label: string }>();

  const currentSessionHasProgress =
    state.progressBySession[state.activeSessionId]?.currentOrder !== null;

  function handleClick(sessionId: string, label: string) {
    if (sessionId === state.activeSessionId) return;
    if (currentSessionHasProgress) {
      switchConfirm.request({ id: sessionId, label });
    } else {
      selectSession(sessionId);
    }
  }

  if (sessions.length === 0) return null;

  return (
    <div className="flex gap-1 overflow-x-auto pb-0.5">
      {sessions.map((s) => {
        const active = s.id === state.activeSessionId;
        const progress = state.progressBySession[s.id];
        const isLive =
          progress &&
          progress.currentOrder !== null &&
          progress.currentOrder <= s.items.length;

        return (
          <button
            key={s.id}
            type="button"
            onClick={() => handleClick(s.id, `${s.dayLabel} ${s.sessionLabel}`)}
            aria-current={active ? "true" : undefined}
            aria-label={`${s.dayLabel} ${s.sessionLabel}${isLive ? " (in progress)" : ""}`}
            className={cn(
              "shrink-0 rounded-lg px-3.5 py-1.5 text-left transition-all duration-150 cursor-pointer whitespace-nowrap",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              active
                ? "bg-surface-1 border border-[var(--color-border-strong)]"
                : "hover:bg-surface-1 border border-transparent"
            )}
          >
            <span className="flex items-center gap-1.5">
              <span
                className={cn(
                  "text-[11px] font-semibold tracking-wide",
                  active ? "text-primary" : "text-secondary"
                )}
              >
                {s.dayLabel}
              </span>
              {isLive && (
                <span
                  className="h-1.5 w-1.5 rounded-full bg-status-green live-pulse"
                  aria-hidden="true"
                />
              )}
            </span>
            <p
              className={cn(
                "text-[10px] mt-0.5",
                active ? "text-secondary" : "text-tertiary"
              )}
            >
              {s.sessionLabel}
            </p>
          </button>
        );
      })}

      <ConfirmDialog
        open={switchConfirm.isOpen}
        title={`Switch to ${switchConfirm.pending?.label}?`}
        description="The current session has already started. Switching changes what's live on every connected display."
        confirmLabel="Switch Session"
        tone="danger"
        onConfirm={() => {
          if (switchConfirm.pending) selectSession(switchConfirm.pending.id);
          switchConfirm.cancel();
        }}
        onCancel={switchConfirm.cancel}
      />
    </div>
  );
}
