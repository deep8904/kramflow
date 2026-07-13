"use client";

import { useEventStore } from "@/lib/store";
import { getSessionById } from "@/lib/cuesheet";
import { audioSummary, getLive, getNext, getOnDeck, lightingSummary, videoSummary } from "@/lib/types";
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

  const prepTarget = next?.type === "item" ? next : live?.type === "item" ? live : null;
  const lighting = prepTarget ? lightingSummary(prepTarget.lights) : null;

  return (
    <TvLayout>
      <TvStack>
        <TvSection>
          <LiveNow program={live} startedAt={progress?.startedAt ?? null} pausedAt={state.pausedAt} />
        </TvSection>

        <TvSection>
          <NextUp program={next} />
        </TvSection>

        <TvSection>
          <OnDeck program={onDeck} />
        </TvSection>

        {prepTarget && (
          <TvSection className="max-w-lg">
            <SectionLabel>Requirements — {prepTarget.title}</SectionLabel>
            <div className="mt-2 divide-y divide-white/5">
              <RequirementRow label="Audio" value={audioSummary(prepTarget.audio)} />
              <RequirementRow label="Video" value={videoSummary(prepTarget.video)} />
              {lighting && <RequirementRow label="Lighting" value={lighting} />}
            </div>
            {prepTarget.notes && (
              <p className="text-body text-muted mt-4">{prepTarget.notes}</p>
            )}
          </TvSection>
        )}

        <AlertBanner alert={state.alert} />
      </TvStack>

      <div className="pt-12">
        <ProgressFooter
          dayLabel={session.dayLabel}
          sessionLabel={session.sessionLabel}
          currentIndex={currentIndex}
          total={total}
        />
      </div>
    </TvLayout>
  );
}
