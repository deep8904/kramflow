"use client";

import { useEventStore } from "@/lib/store";
import { getSessionById } from "@/lib/cuesheet";
import { getLive, getNext, getOnDeck } from "@/lib/types";
import { TvLayout, TvSection, TvStack } from "@/components/tv/tv-layout";
import { LiveNow } from "@/components/tv/live-now";
import { NextUp } from "@/components/tv/next-up";
import { OnDeck } from "@/components/tv/on-deck";
import { SectionLabel } from "@/components/tv/section-label";
import { RequirementRow } from "@/components/tv/requirement-row";
import { AlertBanner } from "@/components/tv/alert-banner";
import { ProgressFooter } from "@/components/tv/progress-footer";

export default function AvPage() {
  const { state } = useEventStore();
  const session = getSessionById(state.activeSessionId);

  if (!session) {
    return (
      <TvLayout>
        <p className="text-title text-muted">No session selected</p>
      </TvLayout>
    );
  }

  const live = getLive(session, state);
  const next = getNext(session, state);
  const onDeck = getOnDeck(session, state);
  const progress = state.progressBySession[state.activeSessionId];
  const total = session.items.length;
  const currentIndex = progress?.currentOrder ?? 0;
  const isFinished = currentIndex > total;

  const prepTarget = next?.type === "item" ? next : live?.type === "item" ? live : null;

  return (
    <TvLayout>
      <div className="flex-1 grid grid-cols-[1fr_auto] gap-24 min-h-0">
        <TvStack>
          <TvSection>
            <LiveNow
              program={live}
              startedAt={progress?.startedAt ?? null}
              pausedAt={state.pausedAt}
              isFinished={isFinished}
            />
          </TvSection>

          <TvSection>
            <NextUp program={next} />
          </TvSection>

          <TvSection>
            <OnDeck program={onDeck} />
          </TvSection>
        </TvStack>

        {prepTarget && (
          <div className="w-[420px] shrink-0 self-start pt-1">
            <SectionLabel>Requirements — {prepTarget.title}</SectionLabel>
            <div className="mt-4 divide-y divide-white/5">
              <RequirementRow label="Audio Needed" value={prepTarget.audio.track ? "Yes" : "No"} />
              <RequirementRow label="Video Needed" value={prepTarget.video.sidescreen !== "none" ? "Yes" : "No"} />
              <RequirementRow label="Mic Required" value={prepTarget.audio.mic ? "Yes" : "No"} />
            </div>
            {prepTarget.notes && (
              <div className="mt-8">
                <SectionLabel>Stage Notes</SectionLabel>
                <p className="text-body text-muted mt-2">{prepTarget.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-10">
        <AlertBanner alert={state.alert} />
        <ProgressFooter
          dayLabel={session.dayLabel}
          sessionLabel={session.sessionLabel}
          currentIndex={Math.min(currentIndex, total)}
          total={total}
        />
      </div>
    </TvLayout>
  );
}
