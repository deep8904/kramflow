"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, Eye, Maximize, RotateCw, Send, Trash2, Wifi, WifiOff, X } from "lucide-react";
import { useAuth } from "@/components/auth/auth-context";
import { useDisplayEngine, useTransportStatus } from "@/lib/display-engine/store";
import { getDisplayStatus } from "@/lib/display-engine/use-register-display";
import type { DisplayInstance, DisplayType } from "@/lib/display-engine/types";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/tv/section-label";
import { ProfileEditor } from "@/components/display-engine/profile-editor";
import { cn } from "@/lib/utils";

const DISPLAY_TYPES: { value: DisplayType; label: string; route: string }[] = [
  { value: "presenter", label: "Presenter", route: "/displays/presenter" },
  { value: "green-room", label: "Green Room", route: "/displays/green-room" },
  { value: "av", label: "AV", route: "/displays/av" },
  { value: "lobby", label: "Lobby", route: "/displays/lobby" },
  { value: "volunteer", label: "Volunteer", route: "/displays/volunteer" },
  { value: "custom", label: "Custom", route: "/displays/presenter" },
];

const inputField =
  "bg-card border border-white/10 rounded-lg px-2.5 py-1.5 text-[14px] text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function routeFor(type: DisplayType): string {
  return DISPLAY_TYPES.find((t) => t.value === type)?.route ?? "/displays/presenter";
}

export default function DisplayManagerPage() {
  const { lock } = useAuth();
  const { state: engine, renameDisplay, assignDisplay, removeDisplay, sendCommand } = useDisplayEngine();
  const transportStatus = useTransportStatus();
  const [now, setNow] = useState(() => Date.now());
  const [previewing, setPreviewing] = useState<DisplayInstance | null>(null);

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

  return (
    <main className="min-h-screen bg-background">
      <header className="flex items-center justify-between gap-4 px-4 sm:px-6 xl:px-12 py-4 xl:py-6 border-b border-white/5">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/operator">
            <Button variant="ghost" size="sm" aria-label="Back to Operator Dashboard">
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            </Button>
          </Link>
          <div className="min-w-0">
            <p className="text-caption uppercase tracking-wide text-muted-2">KramFlow</p>
            <h1 className="text-title text-primary mt-1">Display Manager</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-caption text-muted-2">
            {transportStatus === "open" ? (
              <Wifi className="h-4 w-4 text-status-green" strokeWidth={2} />
            ) : (
              <WifiOff className="h-4 w-4 text-status-orange" strokeWidth={2} />
            )}
            {transportStatus === "open" ? "Sync connected" : transportStatus}
          </span>
          <Button variant="ghost" size="sm" onClick={lock}>
            Lock
          </Button>
        </div>
      </header>

      <div className="px-4 sm:px-6 xl:px-12 py-8">
        <SectionLabel>Connected Displays ({displays.length})</SectionLabel>

        {displays.length === 0 ? (
          <p className="text-body text-muted-2 mt-6">
            No displays have registered yet. Open a display route (e.g. /displays/presenter) on a device to see it here.
          </p>
        ) : (
          <div className="mt-5 flex flex-col gap-3">
            {displays.map((display) => {
              const status = getDisplayStatus(display, now);
              return (
                <div key={display.id} className="rounded-card bg-card px-6 py-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full shrink-0",
                          status === "online" ? "bg-status-green" : "bg-status-red"
                        )}
                        title={status}
                      />
                      <input
                        value={display.name}
                        onChange={(e) => renameDisplay(display.id, e.target.value)}
                        className={cn(inputField, "font-medium min-w-0")}
                        aria-label="Display name"
                      />
                    </div>
                    <div className="flex items-center gap-4 text-caption text-muted-2 shrink-0">
                      <span className="uppercase tracking-wide">{status}</span>
                      <span className="tabular-nums">
                        {display.latencyMs !== null ? `${Math.round(display.latencyMs)}ms` : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-4">
                    <select
                      value={display.type}
                      onChange={(e) => assignDisplay(display.id, { type: e.target.value as DisplayType })}
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
                      value={display.room ?? ""}
                      onChange={(e) => assignDisplay(display.id, { room: e.target.value || null })}
                      placeholder="Room (optional)"
                      className={cn(inputField, "w-40")}
                      aria-label="Room"
                    />

                    <select
                      value={display.profileId ?? ""}
                      onChange={(e) => assignDisplay(display.id, { profileId: e.target.value || null })}
                      className={inputField}
                      aria-label="Profile"
                    >
                      <option value="">No profile</option>
                      {Object.values(engine.profiles).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <Button variant="secondary" size="sm" onClick={() => setPreviewing(display)}>
                      <Eye className="h-3.5 w-3.5" strokeWidth={2} />
                      Preview
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => void takeScreenshot(display)}>
                      <Camera className="h-3.5 w-3.5" strokeWidth={2} />
                      Screenshot
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => sendCommand(display.id, { type: "force-fullscreen", issuedAt: new Date().toISOString() })}
                    >
                      <Maximize className="h-3.5 w-3.5" strokeWidth={2} />
                      Force Fullscreen
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const text = window.prompt("Test message to send to this display:");
                        if (text) sendCommand(display.id, { type: "test-message", text, issuedAt: new Date().toISOString() });
                      }}
                    >
                      <Send className="h-3.5 w-3.5" strokeWidth={2} />
                      Test Message
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => sendCommand(display.id, { type: "reload", issuedAt: new Date().toISOString() })}
                    >
                      <RotateCw className="h-3.5 w-3.5" strokeWidth={2} />
                      Reload / Reconnect
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => removeDisplay(display.id)}>
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                      Remove
                    </Button>
                  </div>
                </div>
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
    </main>
  );
}
