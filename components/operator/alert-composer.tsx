"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEventStore } from "@/lib/store";
import type { AlertSeverity } from "@/lib/types";
import { SectionLabel } from "@/components/tv/section-label";
import { cn } from "@/lib/utils";

const severities: { value: AlertSeverity; label: string; tone: string }[] = [
  { value: "info", label: "Info", tone: "bg-status-blue/15 text-status-blue" },
  { value: "warning", label: "Warning", tone: "bg-status-orange/15 text-status-orange" },
  { value: "critical", label: "Critical", tone: "bg-status-red/15 text-status-red" },
];

export function AlertComposer() {
  const { state, setAlert, dismissAlert } = useEventStore();
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<AlertSeverity>("warning");

  if (state.alert) {
    return (
      <div>
        <SectionLabel>Active Alert</SectionLabel>
        <p className="text-body text-primary mt-3">{state.alert.message}</p>
        <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={dismissAlert}>
          <X className="h-4 w-4" strokeWidth={2} />
          Dismiss
        </Button>
      </div>
    );
  }

  return (
    <div>
      <SectionLabel>Raise Alert</SectionLabel>
      <div className="mt-3 flex flex-col gap-3">
        <Input
          placeholder="e.g. Drama Team, please report Stage Left"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          aria-label="Alert message"
        />
        <div className="flex flex-wrap gap-2">
          {severities.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSeverity(s.value)}
              aria-pressed={severity === s.value}
              className={cn(
                "rounded-full px-3 py-1.5 text-caption font-semibold uppercase tracking-wide transition-opacity cursor-pointer whitespace-nowrap",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                s.tone,
                severity !== s.value && "opacity-40"
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
