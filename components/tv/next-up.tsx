"use client";

import { motion } from "framer-motion";
import type { Program } from "@/lib/types";
import { SectionLabel } from "./section-label";

export function NextUp({
  program,
  prepareCue,
}: {
  program: Program | null;
  prepareCue?: string;
}) {
  return (
    <div>
      <SectionLabel>Next</SectionLabel>
      <motion.div
        key={program?.id ?? "none"}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="mt-2 flex items-baseline justify-between gap-6"
      >
        <div>
          <p className="text-title text-primary">
            {program ? program.title : "—"}
          </p>
          {program?.presenter && (
            <p className="text-body text-muted mt-1">{program.presenter}</p>
          )}
        </div>
        {program && prepareCue && (
          <span className="text-caption uppercase tracking-[0.1em] text-status-orange font-semibold shrink-0">
            {prepareCue}
          </span>
        )}
      </motion.div>
    </div>
  );
}
