"use client";

import { useEventStore } from "@/lib/store";
import { useSessions } from "@/lib/use-sessions";
import { getSessionById } from "@/lib/data/sessions";
import { getLive, getNext } from "@/lib/types";
import { useDisplayEngine } from "@/lib/display-engine/store";
import { useDisplayClock } from "@/lib/display-engine/use-display-timer";
import { useRegisterDisplay } from "@/lib/display-engine/use-register-display";
import { useTimeSync } from "@/lib/display-engine/use-time-sync";
import { useFullscreen } from "@/lib/display-engine/use-fullscreen";
import { DisplayShell } from "@/components/display-engine/display-shell";
import { HoldScreen } from "@/components/display-engine/hold-screen";
import { BroadcastOverlay } from "@/components/display-engine/broadcast-overlay";
import { SessionTimeline } from "@/components/display-engine/session-timeline";
import { cn } from "@/lib/utils";

/**
 * Volunteer Display — new Display Engine route. The existing data model
 * has no per-volunteer assignment entity, so "assignment" is scoped
 * pragmatically to the responsible team for each program item
 * (Program.team, already collected from the cue sheet) rather than
 * inventing a new volunteer-scheduling subsystem — see
 * docs/DISPLAY_ENGINE.md.
 */
export default function VolunteerDisplayPage() {
  const { state: appState } = useEventStore();
  const sessions = useSessions();
  const session = getSessionById(sessions, appState.activeSessionId);
  const { state: engine } = useDisplayEngine();

  const { offsetMs } = useTimeSync();
  useFullscreen();

  const live = session ? getLive(session, appState) : null;
  const next = session ? getNext(session, appState) : null;
  const progress = session ? appState.progressBySession[appState.activeSessionId] : undefined;
  const currentOrder = progress?.currentOrder ?? null;

  const display = useRegisterDisplay("Volunteer Display", "volunteer", null, (command) => {
    if (command.type === "reload") window.location.reload();
  });

  const clockLabel = useDisplayClock(offsetMs);
  const onBreak = live?.type === "break";
  const stageStatus = appState.pausedAt ? "PAUSED" : live ? "LIVE" : "STANDBY";

  return (
    <DisplayShell>
      <HoldScreen hold={engine.hold} />
      {display && <BroadcastOverlay displayId={display.id} displayType="volunteer" />}

      {!engine.hold.active && (
        <>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-caption uppercase tracking-wide text-muted-2">
                {session ? `${session.dayLabel} • ${session.sessionLabel}` : "KramFlow"}
              </p>
              <p className="text-title text-primary mt-1">Volunteer Board</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-hero tabular-nums text-muted" style={{ fontSize: "clamp(2rem, 3vw, 3rem)" }}>
                {clockLabel}
              </span>
              <span
                className={cn(
                  "text-caption font-semibold uppercase tracking-wide px-3 py-1 rounded-full",
                  stageStatus === "LIVE" && "bg-status-green/15 text-status-green",
                  stageStatus === "PAUSED" && "bg-status-orange/15 text-status-orange",
                  stageStatus === "STANDBY" && "bg-white/5 text-muted-2"
                )}
              >
                {stageStatus}
              </span>
            </div>
          </div>

          {onBreak && (
            <div className="mt-6 rounded-card bg-status-blue/15 px-6 py-4 text-body font-semibold text-status-blue text-center">
              On Break
            </div>
          )}

          <div className="flex-1 grid grid-cols-[1.2fr_1fr] gap-16 min-h-0 mt-8">
            <div className="flex flex-col justify-center">
              <p className="text-caption uppercase tracking-wide text-muted-2">Current Item</p>
              <p className="text-hero text-primary mt-3" style={{ fontSize: "clamp(3rem, 5vw, 4.5rem)" }}>
                {live ? live.title : "Not Started"}
              </p>
              {live?.team && (
                <p className="text-title text-muted mt-3">Responsible team: {live.team}</p>
              )}

              {next && (
                <div className="mt-10 pt-6 border-t border-white/10">
                  <p className="text-caption uppercase tracking-wide text-muted-2">Next</p>
                  <p className="text-subtitle text-muted mt-2">{next.title}</p>
                  {next.team && <p className="text-body text-muted-2 mt-1">Team: {next.team}</p>}
                </div>
              )}
            </div>

            <div className="min-h-0 flex flex-col">
              <p className="text-caption uppercase tracking-wide text-muted-2 mb-2">Upcoming Schedule</p>
              <div className="flex-1 overflow-y-auto rounded-card bg-card/50 px-6">
                {session && <SessionTimeline session={session} currentOrder={currentOrder} emphasize="team" />}
              </div>
            </div>
          </div>
        </>
      )}
    </DisplayShell>
  );
}
