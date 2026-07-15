"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronDown, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/tv/section-label";
import { useDisplayEngine } from "@/lib/display-engine/store";
import { EMERGENCY_PRESETS, type BroadcastType } from "@/lib/display-engine/types";
import { cn } from "@/lib/utils";

const QUICK_TYPES: { value: BroadcastType; label: string; tone: string }[] = [
  { value: "info", label: "Info", tone: "bg-status-blue/15 text-status-blue" },
  { value: "reminder", label: "Reminder", tone: "bg-status-blue/15 text-status-blue" },
  { value: "warning", label: "Warning", tone: "bg-status-orange/15 text-status-orange" },
  { value: "success", label: "Success", tone: "bg-status-green/15 text-status-green" },
];

/**
 * Quick-send broadcast controls embedded directly in the Operator
 * Dashboard's Controls panel — collapsed by default so it adds zero
 * visual weight until an operator opens it. Covers the common case (a
 * quick message to every display) plus one-tap emergency presets; the
 * full Broadcast Center (/broadcast) stays linked for scheduling,
 * templates, drafts, history, and per-display targeting.
 */
export function OperatorBroadcastPanel() {
  const { sendBroadcast } = useDisplayEngine();
  const [expanded, setExpanded] = useState(false);
  const [type, setType] = useState<BroadcastType>("info");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [confirmEmergency, setConfirmEmergency] = useState<(typeof EMERGENCY_PRESETS)[number] | null>(null);
  const [justSent, setJustSent] = useState(false);

  function send() {
    if (!title.trim()) return;
    sendBroadcast({
      type,
      title: title.trim(),
      message: message.trim(),
      icon: null,
      priority: 2,
      target: { kind: "all" },
      expiresInMinutes: null,
      durationSeconds: null,
      acknowledgementRequired: false,
      persistent: false,
      scheduledFor: null,
    });
    setTitle("");
    setMessage("");
    setJustSent(true);
    setTimeout(() => setJustSent(false), 2000);
  }

  function sendEmergency() {
    if (!confirmEmergency) return;
    sendBroadcast({
      type: "emergency",
      title: confirmEmergency.title,
      message: confirmEmergency.message,
      icon: null,
      priority: 3,
      target: { kind: "all" },
      expiresInMinutes: null,
      durationSeconds: null,
      acknowledgementRequired: true,
      persistent: true,
      scheduledFor: null,
    });
    setConfirmEmergency(null);
  }

  return (
    <div className="border-t border-white/5 pt-8">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex items-center justify-between w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
      >
        <SectionLabel>Broadcast</SectionLabel>
        <ChevronDown
          className={cn("h-4 w-4 text-muted-2 transition-transform", expanded && "rotate-180")}
          strokeWidth={2}
        />
      </button>

      {expanded && (
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {QUICK_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                aria-pressed={type === t.value}
                className={cn(
                  "rounded-full px-3 py-1.5 text-caption font-semibold uppercase tracking-wide transition-opacity cursor-pointer whitespace-nowrap",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  t.tone,
                  type !== t.value && "opacity-40"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Broadcast title" />
          <Input
            placeholder="Message (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            aria-label="Broadcast message"
          />

          <Button variant="primary" size="sm" className="w-full" disabled={!title.trim()} onClick={send}>
            <Send className="h-4 w-4" strokeWidth={2} />
            {justSent ? "Sent" : "Send to All Displays"}
          </Button>

          <Link
            href="/broadcast"
            className="text-caption text-muted-2 hover:text-primary text-center underline-offset-2 hover:underline"
          >
            More options — schedule, templates, target one display →
          </Link>

          <div className="border-t border-white/5 pt-3 mt-1">
            {confirmEmergency ? (
              <div className="rounded-lg bg-status-red/10 border border-status-red/30 p-3">
                <p className="text-caption text-primary">
                  Send <span className="font-semibold">{confirmEmergency.title}</span> to every display?
                </p>
                <div className="flex gap-2 mt-2">
                  <Button variant="danger" size="sm" className="flex-1" onClick={sendEmergency}>
                    Confirm
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmEmergency(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {EMERGENCY_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setConfirmEmergency(preset)}
                    className="flex items-center gap-1.5 rounded-full bg-status-red/15 text-status-red px-3 py-1.5 text-caption font-semibold cursor-pointer hover:bg-status-red/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
