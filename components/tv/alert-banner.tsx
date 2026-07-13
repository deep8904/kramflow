"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import type { Alert } from "@/lib/types";
import { cn } from "@/lib/utils";

const severityStyles: Record<Alert["severity"], string> = {
  info: "bg-status-blue/15 text-status-blue",
  warning: "bg-status-orange/15 text-status-orange",
  critical: "bg-status-red/15 text-status-red",
};

export function AlertBanner({ alert }: { alert: Alert | null }) {
  return (
    <AnimatePresence>
      {alert && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={cn(
            "flex items-center gap-4 rounded-card px-8 py-6",
            severityStyles[alert.severity]
          )}
        >
          <AlertTriangle className="h-8 w-8 shrink-0" strokeWidth={2} />
          <p className="text-subtitle font-medium">{alert.message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
