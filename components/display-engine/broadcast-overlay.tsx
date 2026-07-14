"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Bell, CheckCircle2, Info, MessageSquare } from "lucide-react";
import { useDisplayEngine, targetMatchesDisplay } from "@/lib/display-engine/store";
import type { BroadcastMessage, BroadcastType, DisplayType } from "@/lib/display-engine/types";
import { cn } from "@/lib/utils";

// Container stays fully opaque (bg-card/95 + blur, the same floating-chrome
// convention used by the Presenter Display's own control bar) so a banner
// never lets page content bleed through and collide with its text — only
// the icon chip carries the type's accent tint.
const TYPE_STYLES: Record<BroadcastType, { accent: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }> = {
  info: { accent: "bg-status-blue/15 text-status-blue", icon: Info },
  reminder: { accent: "bg-status-blue/15 text-status-blue", icon: Bell },
  warning: { accent: "bg-status-orange/15 text-status-orange", icon: AlertTriangle },
  success: { accent: "bg-status-green/15 text-status-green", icon: CheckCircle2 },
  emergency: { accent: "bg-status-red text-white", icon: AlertTriangle },
  custom: { accent: "bg-white/10 text-primary", icon: MessageSquare },
};

function effectiveExpiry(message: BroadcastMessage): number | null {
  if (message.durationSeconds !== null) return Date.parse(message.createdAt) + message.durationSeconds * 1000;
  if (message.expiresAt) return Date.parse(message.expiresAt);
  return null;
}

export function BroadcastOverlay({ displayId, displayType }: { displayId: string; displayType: DisplayType }) {
  const { state, acknowledgeBroadcast, dismissBroadcast } = useDisplayEngine();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const display = state.registry[displayId];
  const targeted = state.broadcasts.active.filter((message) => {
    const expiry = effectiveExpiry(message);
    if (expiry !== null && now > expiry) return false;
    if (!display) {
      return (
        message.target.kind === "all" ||
        (message.target.kind === "type" && message.target.value === displayType)
      );
    }
    return targetMatchesDisplay(message.target, display, state.groups);
  });

  const emergency = targeted.find((m) => m.type === "emergency");
  const banners = targeted.filter((m) => m.type !== "emergency").sort((a, b) => b.priority - a.priority);

  return (
    <>
      <AnimatePresence>
        {emergency && (
          <motion.div
            key={emergency.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-status-red text-white text-center px-16"
          >
            <AlertTriangle className="h-20 w-20 mb-8" strokeWidth={1.5} />
            <h1 className="text-hero">{emergency.title}</h1>
            {emergency.message && <p className="text-title mt-6 opacity-90">{emergency.message}</p>}
            {emergency.acknowledgementRequired && !emergency.acknowledgedBy.includes(displayId) && (
              <button
                type="button"
                onClick={() => acknowledgeBroadcast(emergency.id, displayId)}
                className="mt-12 rounded-full bg-white text-status-red px-8 py-4 text-subtitle font-semibold cursor-pointer"
              >
                Acknowledge
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!emergency && banners.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 flex flex-col gap-3 p-6">
          <AnimatePresence>
            {banners.slice(0, 3).map((message) => {
              const style = TYPE_STYLES[message.type];
              const Icon = style.icon;
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="flex items-center gap-4 rounded-card bg-card/95 backdrop-blur px-6 py-4 shadow-lg"
                >
                  <span className={cn("flex items-center justify-center h-10 w-10 rounded-full shrink-0", style.accent)}>
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-body text-primary font-semibold truncate">{message.title}</p>
                    {message.message && <p className="text-caption text-muted truncate">{message.message}</p>}
                  </div>
                  {!message.persistent && (
                    <button
                      type="button"
                      onClick={() => dismissBroadcast(message.id)}
                      className="text-caption text-muted hover:text-primary cursor-pointer shrink-0"
                    >
                      Dismiss
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}
