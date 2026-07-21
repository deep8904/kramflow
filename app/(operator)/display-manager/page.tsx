"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, Eye, Maximize, RotateCw, Send, Trash2, Wifi, WifiOff, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/components/auth/auth-context";
import { useDisplayEngine, useTransportStatus } from "@/lib/display-engine/store";
import { getDisplayStatus } from "@/lib/display-engine/use-register-display";
import type { DisplayInstance, DisplayType } from "@/lib/display-engine/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProfileEditor } from "@/components/display-engine/profile-editor";
import { ConfirmDialog, useConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

// The 4 canonical display types (Operator/Remote aren't Display Engine
// surfaces, so they're not here).
const DISPLAY_TYPES: { value: DisplayType; label: string; route: string }[] = [
  { value: "presenter", label: "Presenter", route: "/presenter" },
  { value: "green-room", label: "Green Room", route: "/green-room" },
  { value: "av", label: "AV", route: "/av" },
  { value: "general", label: "General", route: "/general" },
  { value: "custom", label: "Custom", route: "/presenter" },
];

const inputField =
  "bg-surface-2 border border-[var(--color-border)] rounded-lg px-2.5 py-1.5 text-[13px] text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:ring-offset-1 focus-visible:ring-offset-background transition-colors hover:border-[var(--color-border-strong)]";

function routeFor(type: DisplayType): string {
  return DISPLAY_TYPES.find((t) => t.value === type)?.route ?? "/presenter";
}

type ConfirmAction =
  | { kind: "reassign-type"; id: string; name: string; type: DisplayType }
  | { kind: "reload"; id: string; name: string }
  | { kind: "remove"; id: string; name: string };

export default function DisplayManagerPage() {
  const { lock } = useAuth();
  const { state: engine, renameDisplay, assignDisplay, removeDisplay, sendCommand } = useDisplayEngine();
  const transportStatus = useTransportStatus();
  const toast = useToast();
  const [now, setNow] = useState(() => Date.now());
  const [previewing, setPreviewing] = useState<DisplayInstance | null>(null);
  const [messagingId, setMessagingId] = useState<string | null>(null);
  const confirmAction = useConfirmDialog<ConfirmAction>();

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  const displays = Object.values(engine.registry).sort((a, b) => Date.parse(b.registeredAt) - Date.parse(a.registeredAt));

  async function takeScreenshot(display: DisplayInstance) {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
      window.alert("Screen capture isn't supported in this browser. Use the Preview button instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const track = stream.getVideoTracks()[0];
      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      // Give the decoder a frame to render before capturing it.
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0);
      track.stop();

      const link = document.createElement("a");
      link.download = `${display.name.replace(/\s+/g, "-").toLowerCase()}-screenshot.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // User cancelled the native picker, or capture failed — no-op.
    }
  }

  function handleConfirm() {
    const action = confirmAction.pending;
    if (!action) return;
    switch (action.kind) {
      case "reassign-type":
        assignDisplay(action.id, { type: action.type });
        break;
      case "reload":
        sendCommand(action.id, { type: "reload", issuedAt: new Date().toISOString() });
        toast.success(`Reload sent to ${action.name}`);
        break;
      case "remove":
        removeDisplay(action.id);
        toast.success(`${action.name} removed`);
        break;
    }
    confirmAction.cancel();
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="flex items-center justify-between gap-4 px-5 sm:px-7 xl:px-10 py-3.5 border-b border-[var(--color-border)] bg-background/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/operator">
            <Button variant="ghost" size="sm" aria-label="Back to Operator Dashboard">
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          </Link>
          <span className="h-4 w-px bg-[var(--color-border)]" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.14em] text-tertiary font-medium">KramFlow</p>
            <h1 className="text-[17px] font-semibold text-primary tracking-tight mt-0.5">Display Manager</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[11px] text-tertiary">
            {transportStatus === "open" ? (
              <Wifi className="h-3.5 w-3.5 text-status-green" strokeWidth={1.5} />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-status-orange" strokeWidth={1.5} />
            )}
            <span className="hidden sm:inline">{transportStatus === "open" ? "Connected" : transportStatus}</span>
          </span>
          <Button variant="ghost" size="sm" onClick={lock} className="text-tertiary hover:text-primary">
            <Lock className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span className="hidden sm:inline">Lock</span>
          </Button>
        </div>
      </header>

      <div className="px-5 sm:px-7 xl:px-10 py-8">
        <p className="text-[10px] uppercase tracking-[0.14em] text-tertiary font-medium mb-5">
          Connected Displays ({displays.length})
        </p>

        {displays.length === 0 ? (
          <p className="text-[13px] text-tertiary mt-4">
            No displays have registered yet. Open a display route (e.g. /presenter) on a device to see it here.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {displays.map((display) => {
              const status = getDisplayStatus(display, now);
              return (
                <DisplayRow
                  key={display.id}
                  display={display}
                  status={status}
                  profiles={Object.values(engine.profiles)}
                  onRename={(name) => renameDisplay(display.id, name)}
                  onRoom={(room) => assignDisplay(display.id, { room })}
                  onProfile={(profileId) => assignDisplay(display.id, { profileId })}
                  onRequestTypeChange={(type) =>
                    confirmAction.request({ kind: "reassign-type", id: display.id, name: display.name, type })
                  }
                  onPreview={() => setPreviewing(display)}
                  onScreenshot={() => void takeScreenshot(display)}
                  onForceFullscreen={() =>
                    sendCommand(display.id, { type: "force-fullscreen", issuedAt: new Date().toISOString() })
                  }
                  onOpenMessage={() => setMessagingId(display.id)}
                  onRequestReload={() => confirmAction.request({ kind: "reload", id: display.id, name: display.name })}
                  onRequestRemove={() => confirmAction.request({ kind: "remove", id: display.id, name: display.name })}
                />
              );
            })}
          </div>
        )}

        <ProfileEditor />
      </div>

      {previewing && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8">
          <div className="w-full max-w-5xl">
            <div className="flex items-center justify-between mb-3">
              <p className="text-body text-primary font-medium">{previewing.name} — live preview</p>
              <Button variant="ghost" size="sm" onClick={() => setPreviewing(null)} aria-label="Close preview">
                <X className="h-4 w-4" strokeWidth={2} />
              </Button>
            </div>
            <div className="rounded-card overflow-hidden bg-background aspect-video">
              <iframe
                src={routeFor(previewing.type)}
                title={`${previewing.name} preview`}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}

      <TestMessageDialog
        open={messagingId !== null}
        onClose={() => setMessagingId(null)}
        onSend={(text) => {
          if (messagingId) {
            sendCommand(messagingId, { type: "test-message", text, issuedAt: new Date().toISOString() });
            toast.success("Test message sent");
          }
          setMessagingId(null);
        }}
      />

      <ConfirmDialog
        open={confirmAction.isOpen}
        title={
          confirmAction.pending?.kind === "reassign-type"
            ? `Change ${confirmAction.pending.name}'s display type?`
            : confirmAction.pending?.kind === "reload"
              ? `Reload ${confirmAction.pending.name}?`
              : confirmAction.pending?.kind === "remove"
                ? `Remove ${confirmAction.pending.name}?`
                : ""
        }
        description={
          confirmAction.pending?.kind === "reassign-type"
            ? "This changes what content this physical display shows."
            : confirmAction.pending?.kind === "reload"
              ? "This interrupts whatever's currently on that screen."
              : "This removes it from the registry. It'll reappear automatically if the device is still open on a display route."
        }
        confirmLabel={confirmAction.pending?.kind === "reassign-type" ? "Change Type" : confirmAction.pending?.kind === "reload" ? "Reload" : "Remove"}
        tone="danger"
        onConfirm={handleConfirm}
        onCancel={confirmAction.cancel}
      />
    </main>
  );
}

function DisplayRow({
  display,
  status,
  profiles,
  onRename,
  onRoom,
  onProfile,
  onRequestTypeChange,
  onPreview,
  onScreenshot,
  onForceFullscreen,
  onOpenMessage,
  onRequestReload,
  onRequestRemove,
}: {
  display: DisplayInstance;
  status: "online" | "offline";
  profiles: { id: string; name: string }[];
  onRename: (name: string) => void;
  onRoom: (room: string | null) => void;
  onProfile: (profileId: string | null) => void;
  onRequestTypeChange: (type: DisplayType) => void;
  onPreview: () => void;
  onScreenshot: () => void;
  onForceFullscreen: () => void;
  onOpenMessage: () => void;
  onRequestReload: () => void;
  onRequestRemove: () => void;
}) {
  // Local draft state, committed on blur — renameDisplay/assignDisplay
  // used to fire on every keystroke (onChange), mutating the shared
  // registry (visible in Display Manager on every other device) with no
  // discrete commit step at all. Resetting the draft when the underlying
  // value changes externally is done during render (React's documented
  // "adjusting state when a prop changes" pattern), not in a useEffect.
  const [nameDraft, setNameDraft] = useState(display.name);
  const [trackedName, setTrackedName] = useState(display.name);
  if (display.name !== trackedName) {
    setTrackedName(display.name);
    setNameDraft(display.name);
  }

  const [roomDraft, setRoomDraft] = useState(display.room ?? "");
  const [trackedRoom, setTrackedRoom] = useState(display.room ?? "");
  if ((display.room ?? "") !== trackedRoom) {
    setTrackedRoom(display.room ?? "");
    setRoomDraft(display.room ?? "");
  }

  return (
    <div className="rounded-xl bg-surface-1 border border-[var(--color-border)] px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={cn(
              "h-2 w-2 rounded-full shrink-0",
              status === "online" ? "bg-status-green live-pulse" : "bg-tertiary/40"
            )}
            title={status}
          />
          <input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={() => {
              if (nameDraft.trim() && nameDraft !== display.name) onRename(nameDraft.trim());
            }}
            className={cn(inputField, "font-medium min-w-0")}
            aria-label="Display name"
          />
        </div>
        <div className="flex items-center gap-3 text-[11px] text-tertiary shrink-0">
          <span
            className={cn(
              "uppercase tracking-[0.1em] font-medium",
              status === "online" ? "text-status-green" : "text-tertiary"
            )}
          >
            {status}
          </span>
          <span className="tabular">{display.latencyMs !== null ? `${Math.round(display.latencyMs)}ms` : "—"}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-4">
        <select
          value={display.type}
          onChange={(e) => onRequestTypeChange(e.target.value as DisplayType)}
          className={inputField}
          aria-label="Display type"
        >
          {DISPLAY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <input
          value={roomDraft}
          onChange={(e) => setRoomDraft(e.target.value)}
          onBlur={() => {
            if (roomDraft !== (display.room ?? "")) onRoom(roomDraft || null);
          }}
          placeholder="Room (optional)"
          className={cn(inputField, "w-40")}
          aria-label="Room"
        />

        <select
          value={display.profileId ?? ""}
          onChange={(e) => onProfile(e.target.value || null)}
          className={inputField}
          aria-label="Profile"
        >
          <option value="">No profile</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-4">
        <Button variant="secondary" size="sm" onClick={onPreview}>
          <Eye className="h-3.5 w-3.5" strokeWidth={2} />
          Preview
        </Button>
        <Button variant="secondary" size="sm" onClick={onScreenshot}>
          <Camera className="h-3.5 w-3.5" strokeWidth={2} />
          Screenshot
        </Button>
        <Button variant="secondary" size="sm" onClick={onForceFullscreen}>
          <Maximize className="h-3.5 w-3.5" strokeWidth={2} />
          Force Fullscreen
        </Button>
        <Button variant="secondary" size="sm" onClick={onOpenMessage}>
          <Send className="h-3.5 w-3.5" strokeWidth={2} />
          Test Message
        </Button>
        <Button variant="secondary" size="sm" onClick={onRequestReload}>
          <RotateCw className="h-3.5 w-3.5" strokeWidth={2} />
          Reload / Reconnect
        </Button>
        <Button variant="danger" size="sm" onClick={onRequestRemove}>
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
          Remove
        </Button>
      </div>
    </div>
  );
}

// Styled replacement for window.prompt() — typing the message is itself
// the deliberate gate (same reasoning as Alert/Broadcast composers), so
// this doesn't need a second confirm step on top, just a real component
// instead of a native browser dialog.
function TestMessageDialog({
  open,
  onClose,
  onSend,
}: {
  open: boolean;
  onClose: () => void;
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");
  // Clear the field each time the dialog opens — during render (React's
  // documented "adjusting state when a prop changes" pattern), not a
  // useEffect.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setText("");
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-sm rounded-card bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-subtitle text-primary">Send a test message</h2>
            <Input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Message to show on this display"
              aria-label="Test message"
              className="mt-4"
              onKeyDown={(e) => {
                if (e.key === "Enter" && text.trim()) onSend(text.trim());
              }}
            />
            <div className="flex items-center gap-3 mt-6">
              <Button variant="primary" size="md" className="flex-1" disabled={!text.trim()} onClick={() => onSend(text.trim())}>
                Send
              </Button>
              <Button variant="ghost" size="md" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
