"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useDisplayEngine } from "@/lib/display-engine/store";
import { newId } from "@/lib/display-engine/store";
import type { DisplayProfile, DisplayWidget } from "@/lib/display-engine/types";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/tv/section-label";
import { cn } from "@/lib/utils";

const ALL_WIDGETS: DisplayWidget[] = [
  "timer",
  "clock",
  "program-title",
  "program-subtitle",
  "next-program",
  "progress-ring",
  "speaker",
  "room",
  "messages",
  "stage-status",
  "alerts",
  "running-order",
  "session-name",
];

const inputField =
  "bg-card border border-white/10 rounded-lg px-2.5 py-1.5 text-[14px] text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function blankProfile(): DisplayProfile {
  return {
    id: newId("profile"),
    name: "New Profile",
    builtIn: false,
    layout: { fontScale: 1, showProgressRing: true, showClock: true, orientation: "landscape" },
    visibleWidgets: ["timer", "clock"],
    colorOverrides: {},
    refreshMs: 15000,
  };
}

/**
 * Display Profiles management — reusable presentation presets, built on
 * top of the profile data model already used by BUILT_IN_PROFILES
 * (lib/display-engine/defaults.ts). Built-in profiles are read-only;
 * operators create/edit/delete their own from here, then assign them to
 * displays from the Display Manager list above.
 */
export function ProfileEditor() {
  const { state: engine, saveProfile, deleteProfile } = useDisplayEngine();
  const [editing, setEditing] = useState<DisplayProfile | null>(null);

  const profiles = Object.values(engine.profiles).sort((a, b) => Number(a.builtIn) - Number(b.builtIn));

  function toggleWidget(widget: DisplayWidget) {
    if (!editing) return;
    const has = editing.visibleWidgets.includes(widget);
    setEditing({
      ...editing,
      visibleWidgets: has ? editing.visibleWidgets.filter((w) => w !== widget) : [...editing.visibleWidgets, widget],
    });
  }

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between">
        <SectionLabel>Display Profiles</SectionLabel>
        <Button variant="secondary" size="sm" onClick={() => setEditing(blankProfile())}>
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          New Profile
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {profiles.map((profile) => (
          <div key={profile.id} className="rounded-card bg-card px-5 py-4 min-w-[220px]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-body text-primary font-medium">{profile.name}</p>
                <p className="text-caption text-muted-2 mt-0.5">
                  {profile.builtIn ? "Built-in" : "Custom"} • {profile.layout.fontScale}x • {profile.visibleWidgets.length} widgets
                </p>
              </div>
              {!profile.builtIn && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditing(profile)}
                    aria-label="Edit profile"
                    className="h-7 w-7 rounded-full flex items-center justify-center text-muted hover:text-primary hover:bg-white/5 cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteProfile(profile.id)}
                    aria-label="Delete profile"
                    className="h-7 w-7 rounded-full flex items-center justify-center text-muted hover:text-status-red hover:bg-white/5 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8">
          <div className="w-full max-w-lg rounded-card bg-background border border-white/10 p-8">
            <p className="text-title text-primary">Edit Profile</p>

            <div className="mt-6 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-caption text-muted-2">Name</span>
                <input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className={inputField}
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-caption text-muted-2">Font Scale</span>
                  <input
                    type="number"
                    step={0.1}
                    min={0.5}
                    max={3}
                    value={editing.layout.fontScale}
                    onChange={(e) =>
                      setEditing({ ...editing, layout: { ...editing.layout, fontScale: Number(e.target.value) } })
                    }
                    className={inputField}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-caption text-muted-2">Orientation</span>
                  <select
                    value={editing.layout.orientation}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        layout: { ...editing.layout, orientation: e.target.value as "landscape" | "portrait" },
                      })
                    }
                    className={inputField}
                  >
                    <option value="landscape">Landscape</option>
                    <option value="portrait">Portrait</option>
                  </select>
                </label>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.layout.showProgressRing}
                    onChange={(e) =>
                      setEditing({ ...editing, layout: { ...editing.layout, showProgressRing: e.target.checked } })
                    }
                    className="h-4 w-4"
                  />
                  <span className="text-caption text-muted">Show progress ring</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.layout.showClock}
                    onChange={(e) =>
                      setEditing({ ...editing, layout: { ...editing.layout, showClock: e.target.checked } })
                    }
                    className="h-4 w-4"
                  />
                  <span className="text-caption text-muted">Show clock</span>
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-caption text-muted-2">Refresh Interval (ms)</span>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  value={editing.refreshMs}
                  onChange={(e) => setEditing({ ...editing, refreshMs: Number(e.target.value) })}
                  className={inputField}
                />
              </label>

              <div>
                <span className="text-caption text-muted-2">Visible Widgets</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ALL_WIDGETS.map((widget) => (
                    <button
                      key={widget}
                      type="button"
                      onClick={() => toggleWidget(widget)}
                      className={cn(
                        "text-caption font-medium px-3 py-1.5 rounded-full cursor-pointer transition-colors",
                        editing.visibleWidgets.includes(widget)
                          ? "bg-primary text-background"
                          : "bg-card text-muted hover:text-primary"
                      )}
                    >
                      {widget}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-8">
              <Button
                variant="primary"
                onClick={() => {
                  saveProfile(editing);
                  setEditing(null);
                }}
              >
                Save Profile
              </Button>
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
