"use client";

import Link from "next/link";
import { Tv } from "lucide-react";
import { useEventStore } from "@/lib/store";
import { getSessionById } from "@/lib/cuesheet";
import { NowPlayingCard } from "@/components/operator/now-playing-card";
import { AlertComposer } from "@/components/operator/alert-composer";
import { ProgramList } from "@/components/operator/program-list";
import { SessionSwitcher } from "@/components/operator/session-switcher";
import { Button } from "@/components/ui/button";

export default function OperatorPage() {
  const { state } = useEventStore();
  const session = getSessionById(state.activeSessionId);

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <header className="flex items-center justify-between mb-6 gap-6">
          <div className="min-w-0">
            <p className="text-caption uppercase tracking-wide text-muted-2">
              {session ? `${session.dayLabel} • ${session.sessionLabel}` : "StageFlow"}
            </p>
            <h1 className="text-title text-primary mt-1">StageFlow</h1>
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
          </div>
        </header>

        <div className="mb-8">
          <SessionSwitcher />
        </div>

        {session ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
            <div className="min-w-0">
              <p className="text-caption uppercase tracking-wide text-muted-2 mb-3 px-2">Program</p>
              <ProgramList session={session} />
            </div>

            <div className="flex flex-col gap-6 lg:sticky lg:top-10 lg:self-start">
              <NowPlayingCard session={session} />
              <AlertComposer />
            </div>
          </div>
        ) : (
          <p className="text-body text-muted">No session found.</p>
        )}
      </div>
    </main>
  );
}
