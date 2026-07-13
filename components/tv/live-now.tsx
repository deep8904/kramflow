"use client";

import { motion } from "framer-motion";
import type { Program } from "@/lib/types";
import { useCountdown } from "@/lib/use-countdown";
import { SectionLabel } from "./section-label";
import { ProgressBar } from "./progress-bar";
import { HoldBadge } from "./hold-badge";

export function LiveNow({
  program,
  startedAt,
  pausedAt,
  isFinished,
}: {
  program: Program | null;
  startedAt: string | null;
  pausedAt?: string | null;
  isFinished?: boolean;
}) {
  const countdown = useCountdown(startedAt, program?.durationMinutes ?? 0, pausedAt);

  return (
    <div>
      <div className="flex items-center gap-3">
        <SectionLabel>Live Now</SectionLabel>
        {program && pausedAt && <HoldBadge />}
      </div>
      {program ? (
        <motion.div
          key={program.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="mt-3"
        >
          {program.kicker && (
            <p className="text-subtitle text-muted-2 mb-1">{program.kicker}</p>
          )}
          <h1 className="text-hero text-primary">{program.title}</h1>
          {program.presenter && (
            <p className="text-subtitle text-muted mt-2">{program.presenter}</p>
          )}
          {program.type === "item" && program.durationMinutes > 0 && (
            <div className="mt-8 max-w-xl">
              <ProgressBar
                fraction={countdown.fraction}
                tone={pausedAt ? "orange" : countdown.isOverrun ? "red" : "green"}
              />
              <p className="text-body text-muted mt-3 tabular-nums">
                {countdown.isOverrun
                  ? `${countdown.label} over`
                  : `${countdown.label} remaining`}
              </p>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          key="idle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="mt-3"
        >
          <h1 className="text-hero text-muted">{isFinished ? "Session Finished" : "Not Started"}</h1>
        </motion.div>
      )}
    </div>
  );
}
