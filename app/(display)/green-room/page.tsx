"use client";

import { useEventStore } from "@/lib/store";
import { getSessionById } from "@/lib/cuesheet";
import { getLive, getNext, getOnDeck } from "@/lib/types";
import { TvLayout, TvSection, TvStack } from "@/components/tv/tv-layout";
import { LiveNow } from "@/components/tv/live-now";
import { NextUp } from "@/components/tv/next-up";
import { OnDeck } from "@/components/tv/on-deck";
import { SectionLabel } from "@/components/tv/section-label";
import { AlertBanner } from "@/components/tv/alert-banner";
import { ProgressFooter } from "@/components/tv/progress-footer";

export default function GreenRoomPage() {
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

  return (
    <TvLayout>
      <TvStack>
        <TvSection>
          <LiveNow program={live} startedAt={progress?.startedAt ?? null} pausedAt={state.pausedAt} />
        </TvSection>

        <TvSection>
          <NextUp program={next} prepareCue={next?.type === "item" ? "Prepare Now" : undefined} />
        </TvSection>

        <TvSection>
          <OnDeck program={onDeck} />
        </TvSection>

        {next?.stageNotes && (
          <TvSection>
            <SectionLabel>Entrance</SectionLabel>
            <p className="text-subtitle text-primary mt-2">{next.stageNotes}</p>
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
