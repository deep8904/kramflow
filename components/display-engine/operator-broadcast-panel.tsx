"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronDown, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog, useConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { useDisplayEngine } from "@/lib/display-engine/store";
import { EMERGENCY_PRESETS, type BroadcastType } from "@/lib/display-engine/types";
import { cn } from "@/lib/utils";

const QUICK_TYPES: {
  value: BroadcastType;
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
    value: "reminder",
    label: "Reminder",
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
    value: "success",
    label: "Success",
    bg: "bg-status-green/10",
    text: "text-status-green",
    border: "border-status-green/20",
  },
];

export function OperatorBroadcastPanel() {
  const { sendBroadcast } = useDisplayEngine();
  const toast = useToast();
  const [expanded, setExpanded] = useState(false);
  const [type, setType] = useState<BroadcastType>("info");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const emergencyConfirm = useConfirmDialog<(typeof EMERGENCY_PRESETS)[number]>();

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
    toast.success("Broadcast sent");
  }

  return (
    <div className="border-t border-[var(--color-border)] pt-6">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex items-center justify-between w-full cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:ring-offset-1 focus-visible:ring-offset-background rounded"
      >
        <p className="text-[10px] uppercase tracking-[0.14em] text-tertiary font-medium">
          Broadcast
        </p>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-tertiary transition-transform",
            expanded && "rotate-180"
          )}
          strokeWidth={1.5}
        />
      </button>

      {expanded && (
        <div className="mt-3 flex flex-col gap-2.5">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                aria-pressed={type === t.value}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer border",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20",
                  t.bg,
                  t.text,
                  t.border,
                  type !== t.value && "opacity-35"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Broadcast title"
          />
          <Input
            placeholder="Message (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            aria-label="Broadcast message"
          />

          <Button
            variant="primary"
            size="sm"
            className="w-full"
            disabled={!title.trim()}
            onClick={send}
          >
            <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
            Send to All Displays
          </Button>

          <Link
            href="/broadcast"
            className="text-[11px] text-tertiary hover:text-secondary text-center transition-colors"
          >
            More options: schedule, templates, target display &rarr;
          </Link>

          <div className="border-t border-[var(--color-border)] pt-2.5 mt-1">
            <div className="flex flex-wrap gap-1.5">
              {EMERGENCY_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => emergencyConfirm.request(preset)}
                  className="flex items-center gap-1.5 rounded-lg bg-status-red/10 border border-status-red/20 text-status-red px-2.5 py-1 text-[10px] font-semibold cursor-pointer hover:bg-status-red/18 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-status-red/30"
                >
                  <AlertTriangle className="h-3 w-3" strokeWidth={2} />
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={emergencyConfirm.isOpen}
        title={`Send "${emergencyConfirm.pending?.title}" to every display?`}
        description="This takes over every connected screen immediately."
        confirmLabel="Send Emergency"
        tone="danger"
        onConfirm={() => {
          const preset = emergencyConfirm.pending;
          if (preset) {
            sendBroadcast({
              type: "emergency",
              title: preset.title,
              message: preset.message,
              icon: null,
              priority: 3,
              target: { kind: "all" },
              expiresInMinutes: null,
              durationSeconds: null,
              acknowledgementRequired: true,
              persistent: true,
              scheduledFor: null,
            });
            toast.success("Emergency broadcast sent");
          }
          emergencyConfirm.cancel();
        }}
        onCancel={emergencyConfirm.cancel}
      />
    </div>
  );
}
