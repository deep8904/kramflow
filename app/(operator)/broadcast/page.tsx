"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Copy, Send, Star, Trash2, X } from "lucide-react";
import { useAuth } from "@/components/auth/auth-context";
import { useDisplayEngine } from "@/lib/display-engine/store";
import {
  EMERGENCY_PRESETS,
  type BroadcastDraft,
  type BroadcastTargetKind,
  type BroadcastType,
  type DisplayType,
} from "@/lib/display-engine/types";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/tv/section-label";
import { cn } from "@/lib/utils";

const BROADCAST_TYPES: { value: BroadcastType; label: string }[] = [
  { value: "info", label: "Information" },
  { value: "reminder", label: "Reminder" },
  { value: "warning", label: "Warning" },
  { value: "success", label: "Success" },
  { value: "custom", label: "Custom" },
  { value: "emergency", label: "Emergency" },
];

// Only the 3 display types actually running for this event — see app/page.tsx.
const DISPLAY_TYPES: { value: DisplayType; label: string }[] = [
  { value: "presenter", label: "Presenter" },
  { value: "green-room", label: "Green Room" },
  { value: "av", label: "AV" },
  { value: "custom", label: "Custom" },
];

const inputField =
  "w-full bg-card border border-white/10 rounded-lg px-3 py-2 text-[15px] text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const EMPTY_DRAFT: BroadcastDraft = {
  type: "info",
  title: "",
  message: "",
  icon: null,
  priority: 2,
  target: { kind: "all" },
  expiresInMinutes: null,
  durationSeconds: null,
  acknowledgementRequired: false,
  persistent: false,
  scheduledFor: null,
};

type Tab = "history" | "scheduled" | "templates" | "drafts";

export default function BroadcastCenterPage() {
  const { lock } = useAuth();
  const {
    state: engine,
    sendBroadcast,
    scheduleBroadcast,
    cancelScheduled,
    dismissBroadcast,
    saveTemplate,
    deleteTemplate,
    toggleFavoriteTemplate,
    saveDraft,
    deleteDraft,
  } = useDisplayEngine();

  const [draft, setDraft] = useState<BroadcastDraft>(EMPTY_DRAFT);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [tab, setTab] = useState<Tab>("history");
  const [search, setSearch] = useState("");
  const [pendingEmergency, setPendingEmergency] = useState<(typeof EMERGENCY_PRESETS)[number] | null>(null);
  const [justSent, setJustSent] = useState<string | null>(null);

  function patchDraft(patch: Partial<BroadcastDraft>) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  function patchTarget(kind: BroadcastTargetKind, value?: string) {
    patchDraft({ target: { kind, value } });
  }

  function resetCompose() {
    setDraft(EMPTY_DRAFT);
    setScheduleEnabled(false);
  }

  function handleSend() {
    if (!draft.title.trim()) return;
    if (scheduleEnabled && draft.scheduledFor) {
      scheduleBroadcast(draft, draft.scheduledFor);
      setJustSent("Scheduled");
    } else {
      sendBroadcast(draft);
      setJustSent("Sent");
    }
    resetCompose();
    setTimeout(() => setJustSent(null), 2500);
  }

  function handleEmergencyConfirm() {
    if (!pendingEmergency) return;
    sendBroadcast({
      ...EMPTY_DRAFT,
      type: "emergency",
      title: pendingEmergency.title,
      message: pendingEmergency.message,
      priority: 3,
      target: { kind: "all" },
      acknowledgementRequired: true,
      persistent: true,
    });
    setPendingEmergency(null);
    setJustSent("Emergency broadcast sent");
    setTimeout(() => setJustSent(null), 2500);
  }

  function loadIntoCompose(source: BroadcastDraft) {
    setDraft({ ...source, scheduledFor: null });
    setScheduleEnabled(false);
    setTab("history");
  }

  const filteredHistory = useMemo(() => {
    const q = search.trim().toLowerCase();
    const items = q
      ? engine.broadcasts.history.filter(
          (m) => m.title.toLowerCase().includes(q) || m.message.toLowerCase().includes(q)
        )
      : engine.broadcasts.history;
    return items.slice(0, 50);
  }, [engine.broadcasts.history, search]);

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    const items = q
      ? engine.broadcasts.templates.filter((t) => t.name.toLowerCase().includes(q))
      : engine.broadcasts.templates;
    return [...items].sort((a, b) => {
      const aFav = engine.broadcasts.favorites.includes(a.id) ? 0 : 1;
      const bFav = engine.broadcasts.favorites.includes(b.id) ? 0 : 1;
      return aFav - bFav;
    });
  }, [engine.broadcasts.templates, engine.broadcasts.favorites, search]);

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
            <h1 className="text-title text-primary mt-1">Broadcast Center</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {justSent && <span className="text-caption text-status-green font-medium">{justSent}</span>}
          <Button variant="ghost" size="sm" onClick={lock}>
            Lock
          </Button>
        </div>
      </header>

      {/* Emergency quick-send */}
      <div className="px-4 sm:px-6 xl:px-12 pt-6">
        <SectionLabel>Emergency Broadcast — Overrides Every Display</SectionLabel>
        <div className="mt-3 flex flex-wrap gap-3">
          {EMERGENCY_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setPendingEmergency(preset)}
              className="flex items-center gap-2 rounded-full bg-status-red/15 text-status-red px-4 py-2 text-body font-semibold cursor-pointer hover:bg-status-red/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <AlertTriangle className="h-4 w-4" strokeWidth={2} />
              {preset.label}
            </button>
          ))}
        </div>

        {pendingEmergency && (
          <div className="mt-4 rounded-card bg-status-red/10 border border-status-red/30 px-6 py-4 flex items-center justify-between gap-4">
            <p className="text-body text-primary">
              Send <span className="font-semibold">{pendingEmergency.title}</span> to every connected display now?
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="danger" size="sm" onClick={handleEmergencyConfirm}>
                Confirm Send
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setPendingEmergency(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {engine.broadcasts.active.some((m) => m.type === "emergency") && (
          <div className="mt-4 rounded-card bg-status-red/10 border border-status-red/30 px-6 py-3 flex items-center justify-between">
            <p className="text-caption text-status-red font-medium">An emergency broadcast is currently active.</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => engine.broadcasts.active.filter((m) => m.type === "emergency").forEach((m) => dismissBroadcast(m.id))}
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-8 px-4 sm:px-6 xl:px-12 py-8">
        {/* Compose */}
        <div>
          <SectionLabel>Compose</SectionLabel>
          <div className="mt-4 flex flex-col gap-4">
            <Field label="Type">
              <select
                value={draft.type}
                onChange={(e) => patchDraft({ type: e.target.value as BroadcastType })}
                className={inputField}
              >
                {BROADCAST_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Title">
              <input
                value={draft.title}
                onChange={(e) => patchDraft({ title: e.target.value })}
                placeholder="Broadcast title"
                className={inputField}
              />
            </Field>

            <Field label="Message">
              <textarea
                value={draft.message}
                onChange={(e) => patchDraft({ message: e.target.value })}
                placeholder="Message body"
                rows={3}
                className={cn(inputField, "resize-none")}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Priority">
                <select
                  value={draft.priority}
                  onChange={(e) => patchDraft({ priority: Number(e.target.value) as 1 | 2 | 3 })}
                  className={inputField}
                >
                  <option value={1}>Low</option>
                  <option value={2}>Normal</option>
                  <option value={3}>High</option>
                </select>
              </Field>
              <Field label="Icon (optional)">
                <input
                  value={draft.icon ?? ""}
                  onChange={(e) => patchDraft({ icon: e.target.value || null })}
                  placeholder="e.g. 📢"
                  className={inputField}
                />
              </Field>
            </div>

            <Field label="Target">
              <select
                value={draft.target.kind}
                onChange={(e) => patchTarget(e.target.value as BroadcastTargetKind, undefined)}
                className={inputField}
              >
                <option value="all">All Displays</option>
                <option value="type">Display Type</option>
                <option value="display">Specific Display</option>
                <option value="group">Group</option>
              </select>
            </Field>

            {draft.target.kind === "type" && (
              <Field label="Display Type">
                <select
                  value={draft.target.value ?? ""}
                  onChange={(e) => patchTarget("type", e.target.value)}
                  className={inputField}
                >
                  <option value="" disabled>
                    Select a type
                  </option>
                  {DISPLAY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {draft.target.kind === "display" && (
              <Field label="Display">
                <select
                  value={draft.target.value ?? ""}
                  onChange={(e) => patchTarget("display", e.target.value)}
                  className={inputField}
                >
                  <option value="" disabled>
                    Select a display
                  </option>
                  {Object.values(engine.registry).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {draft.target.kind === "group" && (
              <Field label="Group">
                <select
                  value={draft.target.value ?? ""}
                  onChange={(e) => patchTarget("group", e.target.value)}
                  className={inputField}
                >
                  <option value="" disabled>
                    Select a group
                  </option>
                  {Object.values(engine.groups).map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Expires in (min)">
                <input
                  type="number"
                  min={0}
                  value={draft.expiresInMinutes ?? ""}
                  onChange={(e) => patchDraft({ expiresInMinutes: e.target.value ? Number(e.target.value) : null })}
                  placeholder="No expiry"
                  className={inputField}
                />
              </Field>
              <Field label="Duration (sec)">
                <input
                  type="number"
                  min={0}
                  value={draft.durationSeconds ?? ""}
                  onChange={(e) => patchDraft({ durationSeconds: e.target.value ? Number(e.target.value) : null })}
                  placeholder="Until dismissed"
                  className={inputField}
                />
              </Field>
            </div>

            <div className="flex items-center gap-6">
              <Checkbox
                checked={draft.acknowledgementRequired}
                onChange={(v) => patchDraft({ acknowledgementRequired: v })}
                label="Require acknowledgement"
              />
              <Checkbox
                checked={draft.persistent}
                onChange={(v) => patchDraft({ persistent: v })}
                label="Persistent"
              />
            </div>

            <div>
              <Checkbox
                checked={scheduleEnabled}
                onChange={(v) => {
                  setScheduleEnabled(v);
                  if (!v) patchDraft({ scheduledFor: null });
                }}
                label="Schedule for later"
              />
              {scheduleEnabled && (
                <input
                  type="datetime-local"
                  onChange={(e) =>
                    patchDraft({ scheduledFor: e.target.value ? new Date(e.target.value).toISOString() : null })
                  }
                  className={cn(inputField, "mt-3")}
                />
              )}
            </div>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Button variant="primary" onClick={handleSend} disabled={!draft.title.trim()}>
                <Send className="h-4 w-4" strokeWidth={2} />
                {scheduleEnabled && draft.scheduledFor ? "Schedule" : "Send Now"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  if (!draft.title.trim()) return;
                  saveDraft(draft);
                }}
              >
                Save Draft
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  if (!draft.title.trim()) return;
                  saveTemplate(draft.title, draft);
                }}
              >
                Save as Template
              </Button>
            </div>
          </div>
        </div>

        {/* History / Scheduled / Templates / Drafts */}
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-1 rounded-full bg-card p-1">
              <TabButton active={tab === "history"} onClick={() => setTab("history")}>
                History
              </TabButton>
              <TabButton active={tab === "scheduled"} onClick={() => setTab("scheduled")}>
                Scheduled ({engine.broadcasts.scheduled.length})
              </TabButton>
              <TabButton active={tab === "templates"} onClick={() => setTab("templates")}>
                Templates
              </TabButton>
              <TabButton active={tab === "drafts"} onClick={() => setTab("drafts")}>
                Drafts ({engine.broadcasts.drafts.length})
              </TabButton>
            </div>
            {(tab === "history" || tab === "templates") && (
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className={cn(inputField, "w-full sm:w-56")}
              />
            )}
          </div>

          <div className="mt-5 flex flex-col gap-3">
            {tab === "history" &&
              (filteredHistory.length === 0 ? (
                <EmptyState text="No broadcasts sent yet." />
              ) : (
                filteredHistory.map((m) => (
                  <div key={m.id} className="rounded-card bg-card px-6 py-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-caption uppercase tracking-wide text-muted-2">
                        {m.type} • {new Date(m.createdAt).toLocaleString()}
                      </p>
                      <p className="text-body text-primary font-medium mt-1">{m.title}</p>
                      {m.message && <p className="text-caption text-muted mt-1">{m.message}</p>}
                      {m.acknowledgementRequired && (
                        <p className="text-caption text-muted-2 mt-1">Acknowledged by {m.acknowledgedBy.length}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <IconButton label="Duplicate into compose" onClick={() => loadIntoCompose(toDraft(m))}>
                        <Copy className="h-4 w-4" strokeWidth={2} />
                      </IconButton>
                      {engine.broadcasts.active.some((a) => a.id === m.id) && (
                        <IconButton label="Dismiss" onClick={() => dismissBroadcast(m.id)}>
                          <X className="h-4 w-4" strokeWidth={2} />
                        </IconButton>
                      )}
                    </div>
                  </div>
                ))
              ))}

            {tab === "scheduled" &&
              (engine.broadcasts.scheduled.length === 0 ? (
                <EmptyState text="No broadcasts scheduled." />
              ) : (
                engine.broadcasts.scheduled.map((m) => (
                  <div key={m.id} className="rounded-card bg-card px-6 py-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-caption uppercase tracking-wide text-muted-2">
                        fires {m.scheduledFor ? new Date(m.scheduledFor).toLocaleString() : "—"}
                      </p>
                      <p className="text-body text-primary font-medium mt-1">{m.title}</p>
                      {m.message && <p className="text-caption text-muted mt-1">{m.message}</p>}
                    </div>
                    <IconButton label="Cancel" onClick={() => cancelScheduled(m.id)}>
                      <Trash2 className="h-4 w-4" strokeWidth={2} />
                    </IconButton>
                  </div>
                ))
              ))}

            {tab === "templates" &&
              (filteredTemplates.length === 0 ? (
                <EmptyState text="No templates saved yet." />
              ) : (
                filteredTemplates.map((t) => (
                  <div key={t.id} className="rounded-card bg-card px-6 py-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-caption uppercase tracking-wide text-muted-2">{t.draft.type}</p>
                      <p className="text-body text-primary font-medium mt-1">{t.name}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <IconButton
                        label={engine.broadcasts.favorites.includes(t.id) ? "Unfavorite" : "Favorite"}
                        onClick={() => toggleFavoriteTemplate(t.id)}
                      >
                        <Star
                          className={cn(
                            "h-4 w-4",
                            engine.broadcasts.favorites.includes(t.id) && "fill-status-orange text-status-orange"
                          )}
                          strokeWidth={2}
                        />
                      </IconButton>
                      <IconButton label="Use template" onClick={() => loadIntoCompose(t.draft)}>
                        <Copy className="h-4 w-4" strokeWidth={2} />
                      </IconButton>
                      <IconButton label="Delete" onClick={() => deleteTemplate(t.id)}>
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      </IconButton>
                    </div>
                  </div>
                ))
              ))}

            {tab === "drafts" &&
              (engine.broadcasts.drafts.length === 0 ? (
                <EmptyState text="No drafts saved." />
              ) : (
                engine.broadcasts.drafts.map((d, i) => (
                  <div key={i} className="rounded-card bg-card px-6 py-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-caption uppercase tracking-wide text-muted-2">{d.type}</p>
                      <p className="text-body text-primary font-medium mt-1">{d.title || "Untitled draft"}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <IconButton label="Load" onClick={() => loadIntoCompose(d)}>
                        <Copy className="h-4 w-4" strokeWidth={2} />
                      </IconButton>
                      <IconButton label="Delete" onClick={() => deleteDraft(i)}>
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      </IconButton>
                    </div>
                  </div>
                ))
              ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function toDraft(m: { type: BroadcastType; title: string; message: string; icon: string | null; priority: 1 | 2 | 3; target: BroadcastDraft["target"]; durationSeconds: number | null; acknowledgementRequired: boolean; persistent: boolean }): BroadcastDraft {
  return {
    type: m.type,
    title: m.title,
    message: m.message,
    icon: m.icon,
    priority: m.priority,
    target: m.target,
    expiresInMinutes: null,
    durationSeconds: m.durationSeconds,
    acknowledgementRequired: m.acknowledgementRequired,
    persistent: m.persistent,
    scheduledFor: null,
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-caption text-muted-2">{label}</span>
      {children}
    </label>
  );
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
      <span className="text-caption text-muted">{label}</span>
    </label>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-caption font-medium px-4 py-2 rounded-full cursor-pointer transition-colors",
        active ? "bg-primary text-background" : "text-muted hover:text-primary"
      )}
    >
      {children}
    </button>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="h-8 w-8 rounded-full flex items-center justify-center text-muted hover:text-primary hover:bg-white/5 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {children}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-body text-muted-2 py-6">{text}</p>;
}
