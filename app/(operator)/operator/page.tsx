"use client";

import Link from "next/link";
import {
  Lock,
  Smartphone,
  Tv2,
  FileSpreadsheet,
  Presentation,
  Megaphone,
  Settings2,
  MonitorPlay,
  Monitor,
} from "lucide-react";
import { useEventStore } from "@/lib/store";
import { useSessions } from "@/lib/use-sessions";
import { getSessionById } from "@/lib/data/sessions";
import { useAuth } from "@/components/auth/auth-context";
import { ProgramList } from "@/components/operator/program-list";
import { SessionSwitcher } from "@/components/operator/session-switcher";
import { LiveDetailsPanel } from "@/components/operator/live-details-panel";
import { ControlsPanel } from "@/components/operator/controls-panel";
import { ProgressFooter } from "@/components/tv/progress-footer";
import { Button } from "@/components/ui/button";

export default function OperatorPage() {
  const { state } = useEventStore();
  const { lock } = useAuth();
  const sessions = useSessions();
  const session = getSessionById(sessions, state.activeSessionId);
  const progress = state.progressBySession[state.activeSessionId];

  return (
    <main className="min-h-screen xl:h-screen xl:overflow-hidden bg-background flex flex-col">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex flex-col xl:flex-row xl:items-center gap-3 xl:gap-6 px-5 sm:px-7 xl:px-10 py-3.5 xl:py-3 border-b border-[var(--color-border)] shrink-0 bg-background/95 backdrop-blur-sm sticky top-0 z-20">
        {/* Left: brand + session context */}
        <div className="flex items-center justify-between xl:contents gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              {state.progressBySession[state.activeSessionId]?.currentOrder !== null &&
               state.progressBySession[state.activeSessionId]?.currentOrder !== undefined ? (
                <span className="h-1.5 w-1.5 rounded-full bg-status-green live-pulse shrink-0" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-tertiary shrink-0" />
              )}
              <span className="text-[11px] uppercase tracking-[0.14em] text-tertiary font-medium hidden sm:block">
                {session
                  ? `${session.dayLabel} · ${session.sessionLabel}`
                  : "KramFlow"}
              </span>
            </div>
            <span className="text-tertiary/30 text-xs hidden sm:block">/</span>
            <p className="text-[15px] font-semibold text-primary tracking-tight">Operator</p>
          </div>

          <Button variant="ghost" size="sm" className="xl:hidden" onClick={lock} aria-label="Lock">
            <Lock className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>

        {/* Center: session tabs */}
        <div className="xl:flex-1 xl:min-w-0">
          <SessionSwitcher />
        </div>

        {/* Right: quick-launch links */}
        <nav aria-label="Quick launch" className="flex items-center flex-wrap gap-1.5 shrink-0">
          <Link href="/operator/cue-sheet">
            <Button variant="ghost" size="sm" className="text-tertiary hover:text-primary">
              <FileSpreadsheet className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span className="hidden sm:inline">Cue Sheet</span>
            </Button>
          </Link>
          <Link href="/green-room" target="_blank">
            <Button variant="ghost" size="sm" className="text-tertiary hover:text-primary">
              <Tv2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span className="hidden lg:inline">Green Room</span>
            </Button>
          </Link>
          <Link href="/av" target="_blank">
            <Button variant="ghost" size="sm" className="text-tertiary hover:text-primary">
              <MonitorPlay className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span className="hidden lg:inline">AV</span>
            </Button>
          </Link>
          <Link href="/general" target="_blank">
            <Button variant="ghost" size="sm" className="text-tertiary hover:text-primary">
              <Monitor className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span className="hidden lg:inline">General</span>
            </Button>
          </Link>
          <Link href="/presenter" target="_blank">
            <Button variant="ghost" size="sm" className="text-tertiary hover:text-primary">
              <Presentation className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span className="hidden lg:inline">Presenter</span>
            </Button>
          </Link>
          <Link href="/remote" target="_blank">
            <Button variant="ghost" size="sm" className="text-tertiary hover:text-primary">
              <Smartphone className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span className="hidden lg:inline">Remote</span>
            </Button>
          </Link>

          {/* Divider */}
          <span className="h-4 w-px bg-[var(--color-border)] mx-0.5 hidden sm:block" aria-hidden="true" />

          <Link href="/broadcast">
            <Button variant="ghost" size="sm" className="text-tertiary hover:text-primary">
              <Megaphone className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span className="hidden lg:inline">Broadcast</span>
            </Button>
          </Link>
          <Link href="/display-manager">
            <Button variant="ghost" size="sm" className="text-tertiary hover:text-primary">
              <Settings2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span className="hidden lg:inline">Displays</span>
            </Button>
          </Link>

          <Button variant="ghost" size="sm" className="hidden xl:inline-flex text-tertiary hover:text-primary ml-1" onClick={lock} aria-label="Lock">
            <Lock className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Button>
        </nav>
      </header>

      {/* ── Body ───────────────────────────────────────────────── */}
      {session ? (
        <div className="flex-1 xl:min-h-0 grid grid-cols-1 xl:grid-cols-[1fr_336px_272px] 2xl:grid-cols-[1fr_380px_300px]">
          {/* Program list */}
          <div className="min-w-0 xl:min-h-0 xl:overflow-y-auto px-5 sm:px-7 xl:px-10 py-6 xl:py-7">
            <div className="flex items-center justify-between mb-5">
              <p className="text-[10px] uppercase tracking-[0.14em] text-tertiary font-medium">
                Program
              </p>
              <p className="text-[11px] text-tertiary tabular">
                {session.items.length} items
              </p>
            </div>
            <ProgramList session={session} />
          </div>

          {/* Live details */}
          <div className="min-w-0 border-t xl:border-t-0 xl:border-l border-[var(--color-border)] px-5 sm:px-6 xl:px-8 py-6 xl:py-7 xl:overflow-y-auto">
            <LiveDetailsPanel session={session} />
          </div>

          {/* Controls */}
          <div className="min-w-0 border-t xl:border-t-0 xl:border-l border-[var(--color-border)] px-5 sm:px-6 xl:px-7 py-6 xl:py-7 xl:overflow-y-auto">
            <ControlsPanel session={session} />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-20">
          <div className="h-12 w-12 rounded-2xl bg-surface-1 border border-[var(--color-border)] flex items-center justify-center">
            <FileSpreadsheet className="h-5 w-5 text-tertiary" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <p className="text-[15px] font-medium text-primary">
              {sessions.length === 0 ? "No sessions yet" : "No session selected"}
            </p>
            <p className="text-caption text-tertiary mt-1.5">
              {sessions.length === 0
                ? "Upload a cue sheet to get started"
                : "Select a session from the tabs above"}
            </p>
          </div>
          {sessions.length === 0 && (
            <Link href="/operator/cue-sheet">
              <Button variant="primary" size="sm">
                <FileSpreadsheet className="h-4 w-4" strokeWidth={1.5} />
                Upload Cue Sheet
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* ── Footer progress bar ─────────────────────────────────── */}
      {session && (
        <footer className="shrink-0 px-5 sm:px-7 xl:px-10 py-4 border-t border-[var(--color-border)] bg-background/80 backdrop-blur-sm">
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
