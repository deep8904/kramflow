"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEventStore } from "@/lib/store";
import type { AlertSeverity } from "@/lib/types";
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
      <Card className="flex items-center justify-between gap-4">
        <div>
          <p className="text-caption uppercase tracking-wide text-muted-2">Active Alert</p>
          <p className="text-body text-primary mt-1">{state.alert.message}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={dismissAlert}>
          <X className="h-4 w-4" strokeWidth={2} />
          Dismiss
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <p className="text-caption uppercase tracking-wide text-muted-2">Raise Alert</p>
      <div className="mt-3 flex flex-col gap-3">
        <Input
          placeholder="e.g. Drama Team, please report Stage Left"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="flex gap-2">
          {severities.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSeverity(s.value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-caption font-semibold uppercase tracking-wide transition-opacity cursor-pointer whitespace-nowrap",
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
    </Card>
  );
}
