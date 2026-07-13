"use client";

import { motion } from "framer-motion";
import type { Program } from "@/lib/types";
import { SectionLabel } from "./section-label";

export function OnDeck({ program }: { program: Program | null }) {
  return (
    <div>
      <SectionLabel>On Deck</SectionLabel>
      <motion.p
        key={program?.id ?? "none"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="text-subtitle text-muted mt-2"
      >
        {program ? program.title : "—"}
      </motion.p>
    </div>
  );
}
