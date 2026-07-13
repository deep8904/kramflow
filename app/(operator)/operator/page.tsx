"use client";

import Link from "next/link";
import { Smartphone, Tv } from "lucide-react";
import { useEventStore } from "@/lib/store";
import { getSessionById } from "@/lib/cuesheet";
import { ProgramList } from "@/components/operator/program-list";
import { SessionSwitcher } from "@/components/operator/session-switcher";
import { LiveDetailsPanel } from "@/components/operator/live-details-panel";
import { ControlsPanel } from "@/components/operator/controls-panel";
import { ProgressFooter } from "@/components/tv/progress-footer";
import { SectionLabel } from "@/components/tv/section-label";
import { Button } from "@/components/ui/button";

export default function OperatorPage() {
  const { state } = useEventStore();
  const session = getSessionById(state.activeSessionId);
  const progress = state.progressBySession[state.activeSessionId];

  return (
    <main className="h-screen w-screen overflow-hidden bg-background flex flex-col">
      <header className="flex items-center justify-between gap-8 px-12 py-6 border-b border-white/5 shrink-0">
        <div className="min-w-0 shrink-0">
          <p className="text-caption uppercase tracking-wide text-muted-2">
            {session ? `${session.dayLabel} • ${session.sessionLabel}` : "StageFlow"}
          </p>
          <h1 className="text-title text-primary mt-1">StageFlow</h1>
        </div>

        <div className="flex-1 min-w-0">
          <SessionSwitcher />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/green-room" target="_blank">
            <Button variant="secondary" size="sm">
              <Tv className="h-4 w-4" strokeWidth={2} />
              Green Room
            </Button>
          </Link>
          <Link href="/av" target="_blank">
            <Button variant="secondary" size="sm">
              <Tv className="h-4 w-4" strokeWidth={2} />
              AV
            </Button>
          </Link>
          <Link href="/remote" target="_blank">
            <Button variant="secondary" size="sm">
              <Smartphone className="h-4 w-4" strokeWidth={2} />
              Remote
            </Button>
          </Link>
        </div>
      </header>

      {session ? (
        <div className="flex-1 min-h-0 grid grid-cols-[1fr_400px_320px]">
          <div className="min-w-0 min-h-0 overflow-y-auto px-12 py-8">
            <SectionLabel>Program</SectionLabel>
            <div className="mt-4">
              <ProgramList session={session} />
            </div>
          </div>

          <div className="min-w-0 border-l border-white/5 px-10 py-8 overflow-y-auto">
            <LiveDetailsPanel session={session} />
          </div>

          <div className="min-w-0 border-l border-white/5 px-8 py-8 overflow-y-auto">
            <ControlsPanel session={session} />
          </div>
        </div>
      ) : (
        <p className="text-body text-muted px-12 py-8">No session found.</p>
      )}

      {session && (
        <footer className="shrink-0 px-12 py-5 border-t border-white/5">
          <ProgressFooter
            dayLabel={session.dayLabel}
            sessionLabel={session.sessionLabel}
            currentIndex={Math.min(progress?.currentOrder ?? 0, session.items.length)}
            total={session.items.length}
          />
        </footer>
      )}
    </main>
  );
}
