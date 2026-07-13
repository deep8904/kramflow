"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Program } from "@/lib/types";
import { SectionLabel } from "./section-label";

export function OnDeck({ program }: { program: Program | null }) {
  return (
    <div>
      <SectionLabel>On Deck</SectionLabel>
      <AnimatePresence mode="wait">
        <motion.p
          key={program?.id ?? "none"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="text-subtitle text-muted mt-2"
        >
          {program ? program.title : "—"}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
