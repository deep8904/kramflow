"use client";

import { useEventStore } from "@/lib/store";
import { effectiveNotes, type Session, type Program } from "@/lib/types";
import { ConfirmDialog, useConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

type RowStatus = "upcoming" | "live" | "done";

export function ProgramList({ session }: { session: Session }) {
  const { state, jumpTo } = useEventStore();
  const currentOrder =
    state.progressBySession[state.activeSessionId]?.currentOrder ?? null;
  const jumpConfirm = useConfirmDialog<Program>();

  return (
    <div className="flex flex-col">
      {session.items.map((program, index) => {
        const status: RowStatus =
          currentOrder === null
            ? "upcoming"
            : program.order === currentOrder
              ? "live"
              : program.order < currentOrder
                ? "done"
                : "upcoming";
        const previousSection =
          index > 0 ? session.items[index - 1].sectionLabel : null;
        const showSectionHeader =
          program.sectionLabel && program.sectionLabel !== previousSection;
        const hasNotes = effectiveNotes(state, program).length > 0;

        const onClick =
          status === "live" ? undefined : () => jumpConfirm.request(program);

        return (
          <div key={program.id}>
            {showSectionHeader && (
              <p className="text-[10px] uppercase tracking-[0.14em] text-tertiary font-medium mt-8 mb-2.5 px-3 first:mt-0">
                {program.sectionLabel}
              </p>
            )}
            {program.type === "break" ? (
              <BreakRow program={program} status={status} onClick={onClick} />
            ) : (
              <ItemRow
                program={program}
                status={status}
                hasNotes={hasNotes}
                onClick={onClick}
              />
            )}
          </div>
        );
      })}

      <ConfirmDialog
        open={jumpConfirm.isOpen}
        title={`Jump to "${jumpConfirm.pending?.title}"?`}
        description="This changes what's live on every connected display right now."
        confirmLabel="Jump Here"
        onConfirm={() => {
          if (jumpConfirm.pending) jumpTo(jumpConfirm.pending.order);
          jumpConfirm.cancel();
        }}
        onCancel={jumpConfirm.cancel}
      />
    </div>
  );
}

function StatusPip({ status }: { status: RowStatus }) {
  if (status === "live") {
    return (
      <span className="flex items-center gap-1.5 shrink-0">
        <span className="h-1.5 w-1.5 rounded-full bg-status-green live-pulse" />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-status-green">
          Live
        </span>
      </span>
    );
  }
  if (status === "done") {
    return (
      <span className="text-[10px] font-medium uppercase tracking-wide text-tertiary shrink-0">
        Done
      </span>
    );
  }
  return null;
}

function BreakRow({
  program,
  status,
  onClick,
}: {
  program: Program;
  status: RowStatus;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-current={status === "live" ? "true" : undefined}
      aria-label={`Jump to ${program.title}${status === "live" ? " (live)" : ""}`}
      className={cn(
        "w-full flex items-center gap-4 py-2.5 px-3 rounded-lg transition-colors text-left",
        "border-b border-[var(--color-border)] last:border-0",
        onClick ? "cursor-pointer hover:bg-surface-1" : "cursor-default",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        status === "live" && "bg-surface-1"
      )}
    >
      <span className="w-6 text-[11px] text-tertiary tabular shrink-0 text-right">
        {program.order}
      </span>
      <p
        className={cn(
          "text-[13px] italic flex-1 min-w-0 truncate",
          status === "done" ? "text-tertiary" : "text-secondary"
        )}
      >
        {program.title}
      </p>
      <StatusPip status={status} />
    </button>
  );
}

function ItemRow({
  program,
  status,
  hasNotes,
  onClick,
}: {
  program: Program;
  status: RowStatus;
  hasNotes: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-current={status === "live" ? "true" : undefined}
      aria-label={`Jump to ${program.title}${program.presenter ? `, ${program.presenter}` : ""}${status === "live" ? " (live)" : status === "done" ? " (done)" : ""}`}
      className={cn(
        "w-full flex items-center gap-4 py-3 px-3 rounded-lg transition-colors text-left",
        "border-b border-[var(--color-border)] last:border-0",
        onClick ? "cursor-pointer hover:bg-surface-1" : "cursor-default",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        status === "live" && "bg-surface-1"
      )}
    >
      {/* Order number */}
      <span className="w-6 text-[11px] text-tertiary tabular shrink-0 text-right">
        {program.order}
      </span>

      {/* Live indicator bar */}
      <span
        className={cn(
          "w-0.5 h-7 rounded-full shrink-0 transition-colors",
          status === "live"
            ? "bg-status-green"
            : status === "done"
              ? "bg-tertiary/20"
              : "bg-transparent"
        )}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="min-w-0 flex-1">
        {program.kicker && (
          <p className="text-[10px] text-tertiary truncate uppercase tracking-wide">
            {program.kicker}
          </p>
        )}
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "text-[14px] font-medium truncate",
              status === "done" ? "text-tertiary" : "text-primary"
            )}
          >
            {program.title}
          </p>
          {hasNotes && (
            <span
              className="h-1 w-1 rounded-full bg-status-orange shrink-0"
              title="Has notes"
            />
          )}
        </div>
        {program.presenter && (
          <p className="text-[11px] text-secondary truncate mt-0.5">
            {program.presenter}
          </p>
        )}
      </div>

      {/* Time + duration */}
      <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0 min-w-[60px]">
        {program.scheduledStart && (
          <span className="text-[11px] text-tertiary tabular">
            {program.scheduledStart}
          </span>
        )}
        {program.durationMinutes > 0 && (
          <span className="text-[11px] text-tertiary tabular">
            {program.durationMinutes}m
          </span>
        )}
      </div>

      {/* Status */}
      <div className="w-14 flex justify-end shrink-0">
        <StatusPip status={status} />
      </div>
    </button>
  );
}
