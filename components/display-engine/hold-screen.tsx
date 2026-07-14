"use client";

import { motion } from "framer-motion";
import type { HoldState } from "@/lib/display-engine/types";

export function HoldScreen({ hold }: { hold: HoldState }) {
  if (!hold.active) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-background"
    >
      <span className="h-3 w-3 rounded-full bg-status-orange mb-8" />
      <h1 className="text-hero text-primary text-center px-16">{hold.message}</h1>
      {hold.subMessage && <p className="text-title text-muted mt-6 text-center px-16">{hold.subMessage}</p>}
    </motion.div>
  );
}
