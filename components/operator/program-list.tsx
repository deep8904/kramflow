"use client";

import { useEventStore } from "@/lib/store";
import { effectiveNotes, type Session } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ProgramList({ session }: { session: Session }) {
  const { state, jumpTo } = useEventStore();
  const currentOrder = state.progressBySession[state.activeSessionId]?.currentOrder ?? null;

  return (
    <div className="flex flex-col">
      {session.items.map((program, index) => {
        const status =
          currentOrder === null
            ? "upcoming"
            : program.order === currentOrder
              ? "live"
              : program.order < currentOrder
                ? "done"
                : "upcoming";
        const previousSection = index > 0 ? session.items[index - 1].sectionLabel : null;
        const showSectionHeader = program.sectionLabel && program.sectionLabel !== previousSection;
        const hasNotes = effectiveNotes(state, program).length > 0;

        return (
          <div key={program.id}>
            {showSectionHeader && (
              <p className="text-caption uppercase tracking-wide text-muted-2 mt-10 mb-3 px-3 first:mt-0">
                {program.sectionLabel}
              </p>
            )}
            {program.type === "break" ? (
              <div
                className={cn(
                  "flex items-center gap-5 py-3 px-3 rounded-lg cursor-pointer hover:bg-card transition-colors border-b border-white/5",
                  status === "live" && "bg-card"
                )}
                onClick={() => jumpTo(program.order)}
              >
                <span className="w-7 text-caption text-muted-2 tabular-nums shrink-0">{program.order}</span>
                <p className="text-body text-muted-2 italic flex-1">{program.title}</p>
                {status === "live" && <Badge tone="green">Live</Badge>}
                {status === "done" && <Badge tone="muted">Done</Badge>}
              </div>
            ) : (
              <div
                className={cn(
                  "flex items-center gap-5 py-5 px-3 rounded-lg cursor-pointer hover:bg-card transition-colors border-b border-white/5",
                  status === "live" && "bg-card"
                )}
                onClick={() => jumpTo(program.order)}
              >
                <span className="w-7 text-caption text-muted-2 tabular-nums shrink-0">{program.order}</span>

                <div className="min-w-0 flex-1">
                  {program.kicker && (
                    <p className="text-caption text-muted-2 truncate">{program.kicker}</p>
                  )}
                  <p className="text-body text-primary truncate">{program.title}</p>
                  {program.presenter && (
                    <p className="text-caption text-muted truncate mt-0.5">{program.presenter}</p>
                  )}
                </div>

                {hasNotes && <span className="h-1.5 w-1.5 rounded-full bg-status-orange shrink-0" />}

                <span className="text-caption text-muted-2 tabular-nums shrink-0 w-16 text-right">
                  {program.scheduledStart ?? ""}
                </span>

                <span className="text-caption text-muted-2 tabular-nums shrink-0 w-12 text-right">
                  {program.durationMinutes > 0 ? `${program.durationMinutes}m` : "—"}
                </span>

                <div className="w-16 flex justify-end shrink-0">
                  {status === "live" && <Badge tone="green">Live</Badge>}
                  {status === "done" && <Badge tone="muted">Done</Badge>}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
