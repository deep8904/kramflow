"use client";

import { motion } from "framer-motion";
import { TIMER_COLORS } from "@/lib/display-engine/colors";
import type { TimerColorState } from "@/lib/display-engine/types";

export function TimerRing({
  fraction,
  colorState,
  size = 440,
  strokeWidth = 14,
  children,
}: {
  fraction: number;
  colorState: TimerColorState;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, fraction));
  const color = TIMER_COLORS[colorState];
  const blink = colorState === "critical";

  return (
    <motion.div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      animate={blink ? { opacity: [1, 0.35, 1] } : { opacity: 1 }}
      transition={blink ? { duration: 1, repeat: Infinity, ease: "easeInOut" } : { duration: 0.25 }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-card)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: circumference * (1 - clamped) }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </motion.div>
  );
}
