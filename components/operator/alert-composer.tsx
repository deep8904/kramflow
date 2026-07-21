"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEventStore } from "@/lib/store";
import type { AlertSeverity } from "@/lib/types";
import { cn } from "@/lib/utils";

const severities: {
  value: AlertSeverity;
  label: string;
  bg: string;
  text: string;
  border: string;
}[] = [
  {
    value: "info",
    label: "Info",
    bg: "bg-status-blue/10",
    text: "text-status-blue",
    border: "border-status-blue/20",
  },
  {
    value: "warning",
    label: "Warning",
    bg: "bg-status-orange/10",
    text: "text-status-orange",
    border: "border-status-orange/20",
  },
  {
    value: "critical",
    label: "Critical",
    bg: "bg-status-red/10",
    text: "text-status-red",
    border: "border-status-red/20",
  },
];

export function AlertComposer() {
  const { state, setAlert, dismissAlert } = useEventStore();
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<AlertSeverity>("warning");

  if (state.alert) {
    const activeSeverity = severities.find((s) => s.value === state.alert?.severity) ?? severities[1];
    return (
      <div>
        <p className="text-[10px] uppercase tracking-[0.14em] text-tertiary font-medium mb-3">
          Active Alert
        </p>
        <div
          className={cn(
            "rounded-xl border px-4 py-3 flex items-start justify-between gap-3",
            activeSeverity.bg,
            activeSeverity.border
          )}
        >
          <p className={cn("text-[13px] font-medium flex-1", activeSeverity.text)}>
            {state.alert.message}
          </p>
          <button
            type="button"
            onClick={dismissAlert}
            aria-label="Dismiss alert"
            className={cn(
              "mt-0.5 cursor-pointer opacity-70 hover:opacity-100 transition-opacity",
              activeSeverity.text
            )}
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.14em] text-tertiary font-medium mb-3">
        Raise Alert
      </p>
      <div className="flex flex-col gap-2.5">
        <Input
          placeholder="e.g. Drama Team, please report Stage Left"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          aria-label="Alert message"
        />
        <div className="flex gap-1.5">
          {severities.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSeverity(s.value)}
              aria-pressed={severity === s.value}
              className={cn(
                "flex-1 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer border",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                s.bg,
                s.text,
                s.border,
                severity !== s.value && "opacity-35"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <Button
          variant="primary"
          size="sm"
          className="w-full"
          disabled={!message.trim()}
          onClick={() => {
            setAlert({ message: message.trim(), severity });
            setMessage("");
          }}
        >
          Post Alert
        </Button>
      </div>
    </div>
  );
}
