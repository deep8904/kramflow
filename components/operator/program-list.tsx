"use client";

import { useState } from "react";
import { NotebookPen } from "lucide-react";
import { useEventStore } from "@/lib/store";
import { effectiveNotes, type Session } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ProgramList({ session }: { session: Session }) {
  const { state, jumpTo, setNotes } = useEventStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
        const expanded = expandedId === program.id;
        const previousSection = index > 0 ? session.items[index - 1].sectionLabel : null;
        const showSectionHeader = program.sectionLabel && program.sectionLabel !== previousSection;

        return (
          <div key={program.id}>
            {showSectionHeader && (
              <p className="text-caption uppercase tracking-wide text-muted-2 mt-6 mb-2 px-2 first:mt-0">
                {program.sectionLabel}
              </p>
            )}
            <div className="border-b border-white/5 last:border-0">
              {program.type === "break" ? (
                <div
                  className={cn(
                    "flex items-center gap-4 py-3 px-2 rounded-lg cursor-pointer hover:bg-card transition-colors",
                    status === "live" && "bg-card"
                  )}
                  onClick={() => jumpTo(program.order)}
                >
                  <span className="w-6 text-caption text-muted-2 tabular-nums shrink-0">{program.order}</span>
                  <p className="text-caption text-muted-2 italic flex-1">{program.title}</p>
                  {status === "live" && <Badge tone="green">Live</Badge>}
                  {status === "done" && <Badge tone="muted">Done</Badge>}
                </div>
              ) : (
                <div
                  className={cn(
                    "group flex items-center gap-4 py-4 px-2 rounded-lg cursor-pointer hover:bg-card transition-colors",
                    status === "live" && "bg-card"
                  )}
                  onClick={() => jumpTo(program.order)}
                >
                  <span className="w-6 text-caption text-muted-2 tabular-nums shrink-0">{program.order}</span>

                  <div className="min-w-0 flex-1">
                    {program.kicker && (
                      <p className="text-caption text-muted-2 truncate">{program.kicker}</p>
                    )}
                    <p className="text-body text-primary truncate">{program.title}</p>
                    {program.presenter && (
                      <p className="text-caption text-muted truncate">{program.presenter}</p>
                    )}
                  </div>

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

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedId(expanded ? null : program.id);
                    }}
                    className={cn(
                      "shrink-0 cursor-pointer",
                      program.notes || state.notesOverrides[program.id]
                        ? "text-status-orange"
                        : "text-muted-2 hover:text-primary"
                    )}
                    aria-label="Stage notes"
                  >
                    <NotebookPen className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              )}

              {expanded && program.type === "item" && (
                <div className="px-2 pb-4">
                  <NotesField
                    value={effectiveNotes(state, program)}
                    onChange={(v) => setNotes(program.id, v)}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NotesField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <textarea
      defaultValue={value}
      onBlur={(e) => onChange(e.target.value)}
      placeholder="Stage notes — cues, mic setup, entrances…"
      rows={2}
      className="w-full rounded-lg bg-background border border-white/10 px-3.5 py-2.5 text-body text-primary placeholder:text-muted-2 outline-none focus:border-white/25 resize-none"
    />
  );
}
