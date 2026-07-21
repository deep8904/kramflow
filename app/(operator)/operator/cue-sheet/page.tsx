"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Plus, Upload, Pencil, Trash2, CalendarPlus } from "lucide-react";
import { useSessions } from "@/lib/use-sessions";
import { Button } from "@/components/ui/button";
import { ProgramForm } from "@/components/forms/program-form";
import { SessionForm } from "@/components/forms/session-form";
import { ConfirmDialog, useConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import type { ProgramInput } from "@/lib/validation/program";
import type { ParsedProgram, ParsedSession } from "@/lib/parse-cuesheet";
import type { Session } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProgramRow extends ParsedProgram {
  id: string;
}

function rowToInput(row: ProgramRow): Partial<ProgramInput> {
  return {
    sessionId: row.session_id,
    sectionLabel: row.section_label,
    type: row.type,
    name: row.name,
    description: row.description,
    presenter: row.presenter,
    presenterRequirement: row.presenter_requirement,
    presenterContact: row.presenter_contact,
    duration: row.duration,
    startTime: row.start_time,
    endTime: row.end_time,
    audioMics: row.audio_mics,
    audioTrack: row.audio_track,
    videoSidescreen: row.video_sidescreen,
    backdrop: row.backdrop,
    videoPptNeeded: row.video_ppt_needed,
    hallLights: row.hall_lights,
    stageLights: row.stage_lights,
    cameraAngle: row.camera_angle,
    props: row.props,
    curtains: row.curtains,
    remarks: row.remarks,
    status: row.status,
    colorTag: row.color_tag,
  };
}

export default function CueSheetPage() {
  const sessions = useSessions();
  const toast = useToast();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const activeSessionId = selectedSessionId ?? sessions[0]?.id ?? "";

  const [rows, setRows] = useState<ProgramRow[] | null>(null);
  const [loadingRows, setLoadingRows] = useState(false);
  const [panel, setPanel] = useState<
    "none" | "upload" | "create" | "create-session" | { edit: ProgramRow } | { editSession: Session }
  >("none");
  const deleteConfirm = useConfirmDialog<ProgramRow>();
  const deleteSessionConfirm = useConfirmDialog<Session>();

  async function loadRows(sessionId: string) {
    setLoadingRows(true);
    try {
      const res = await fetch(`/api/programs?sessionId=${encodeURIComponent(sessionId)}`);
      const data = await res.json();
      setRows(data.programs ?? []);
    } finally {
      setLoadingRows(false);
    }
  }

  // The first session tab renders as selected by default (activeSessionId
  // falls back to sessions[0]) but rows were only ever fetched from a tab's
  // onClick — so the pre-selected default never loaded its items until the
  // user clicked a tab (even the same one). Load once sessions arrive.
  useEffect(() => {
    // Standard fetch-on-mount pattern, not the derived-state anti-pattern
    // this rule targets — loadRows' setLoadingRows(true) is a side effect
    // of kicking off the fetch, not a synchronous state derivation.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (activeSessionId && rows === null) loadRows(activeSessionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId]);

  async function handleDeleteConfirmed() {
    const row = deleteConfirm.pending;
    if (!row) return;
    await fetch(`/api/programs/${row.id}`, { method: "DELETE" });
    toast.success("Item deleted");
    deleteConfirm.cancel();
    loadRows(activeSessionId);
  }

  async function handleDeleteSessionConfirmed() {
    const target = deleteSessionConfirm.pending;
    if (!target) return;
    await fetch(`/api/sessions/${target.id}`, { method: "DELETE" });
    toast.success("Session deleted");
    deleteSessionConfirm.cancel();
    if (activeSessionId === target.id) {
      setSelectedSessionId(null);
      setRows(null);
    }
  }

  const sessionOptions = sessions.map((s) => ({ id: s.id, label: `${s.dayLabel} • ${s.sessionLabel}` }));

  return (
    <main className="min-h-screen bg-background">
      <header className="flex items-center justify-between gap-4 px-5 sm:px-7 py-3.5 border-b border-[var(--color-border)] bg-background/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/operator">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          </Link>
          <span className="h-4 w-px bg-[var(--color-border)]" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.14em] text-tertiary font-medium">KramFlow</p>
            <h1 className="text-[17px] font-semibold text-primary tracking-tight mt-0.5">Cue Sheet</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setPanel("upload")}>
            <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span className="hidden sm:inline">Import Excel</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => setPanel("create")} disabled={!activeSessionId}>
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            Add item
          </Button>
        </div>
      </header>

      <div className="px-5 sm:px-7 py-7 max-w-4xl mx-auto flex flex-col gap-8">
        <div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.14em] text-tertiary font-medium">Session</p>
            <Button variant="ghost" size="sm" onClick={() => setPanel("create-session")}>
              <CalendarPlus className="h-3.5 w-3.5" strokeWidth={1.5} />
              New session
            </Button>
          </div>
          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
            {sessions.length === 0 && (
              <p className="text-[13px] text-tertiary py-2">
                No sessions yet. Add one to start building the cue sheet.
              </p>
            )}
            {sessions.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "group shrink-0 flex items-center gap-1 rounded-lg pl-3 pr-1.5 py-1.5 text-[12px] font-medium transition-colors border",
                  s.id === activeSessionId
                    ? "bg-surface-1 border-[var(--color-border-strong)] text-primary"
                    : "border-transparent text-tertiary hover:text-primary hover:bg-surface-1 hover:border-[var(--color-border)]"
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSessionId(s.id);
                    loadRows(s.id);
                  }}
                  className="cursor-pointer"
                >
                  {s.dayLabel} • {s.sessionLabel}
                </button>
                <button
                  type="button"
                  aria-label="Edit session"
                  onClick={() => setPanel({ editSession: s })}
                  className="opacity-0 group-hover:opacity-100 hover:text-primary cursor-pointer p-1 shrink-0 transition-opacity"
                >
                  <Pencil className="h-3 w-3" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  aria-label="Delete session"
                  onClick={() => deleteSessionConfirm.request(s)}
                  className="opacity-0 group-hover:opacity-100 hover:text-status-red cursor-pointer p-1 shrink-0 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {panel === "create-session" && (
          <SessionForm
            nextSortOrder={sessions.length}
            onSaved={() => {
              setPanel("none");
              toast.success("Session added");
            }}
            onCancel={() => setPanel("none")}
          />
        )}

        {typeof panel === "object" && "editSession" in panel && (
          <SessionForm
            session={panel.editSession}
            nextSortOrder={sessions.length}
            onSaved={() => {
              setPanel("none");
              toast.success("Session updated");
            }}
            onCancel={() => setPanel("none")}
          />
        )}

        {panel === "upload" && (
          <UploadPanel
            onDone={() => {
              setPanel("none");
              toast.success("Cue sheet imported");
              if (activeSessionId) loadRows(activeSessionId);
            }}
            onCancel={() => setPanel("none")}
          />
        )}

        {panel === "create" && activeSessionId && (
          <div className="rounded-2xl bg-surface-1 border border-[var(--color-border)] p-6">
            <ProgramForm
              sessionId={activeSessionId}
              sessionOptions={sessionOptions}
              onSaved={() => {
                setPanel("none");
                toast.success("Item added");
                loadRows(activeSessionId);
              }}
              onCancel={() => setPanel("none")}
            />
          </div>
        )}

        {typeof panel === "object" && "edit" in panel && (
          <div className="rounded-2xl bg-surface-1 border border-[var(--color-border)] p-6">
            <ProgramForm
              sessionId={panel.edit.session_id}
              sessionOptions={sessionOptions}
              programId={panel.edit.id}
              initial={rowToInput(panel.edit)}
              onSaved={() => {
                setPanel("none");
                toast.success("Item updated");
                loadRows(activeSessionId);
              }}
              onCancel={() => setPanel("none")}
            />
          </div>
        )}

        {panel === "none" && (
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-tertiary font-medium">Items</p>
            <div className="mt-3 flex flex-col">
              {loadingRows && <p className="text-[13px] text-tertiary py-4">Loading…</p>}
              {!loadingRows && rows === null && (
                <p className="text-[13px] text-tertiary py-4">Select a session to view its items.</p>
              )}
              {!loadingRows && rows?.length === 0 && (
                <p className="text-[13px] text-tertiary py-4">No items yet.</p>
              )}
              {rows?.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center gap-3 py-3 px-3 rounded-lg border-b border-[var(--color-border)] last:border-0 hover:bg-surface-1 transition-colors"
                >
                  <span className="w-8 text-[11px] text-tertiary tabular shrink-0">{row.sort_order}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] text-primary truncate">{row.name}</p>
                    {row.presenter && <p className="text-[11px] text-secondary truncate mt-0.5">{row.presenter}</p>}
                  </div>
                  {row.status !== "confirmed" && (
                    <span className="text-[10px] text-tertiary uppercase tracking-wider font-medium shrink-0">{row.status}</span>
                  )}
                  <button
                    type="button"
                    aria-label="Edit"
                    onClick={() => setPanel({ edit: row })}
                    className="text-muted-2 hover:text-primary cursor-pointer p-1.5 shrink-0"
                  >
                    <Pencil className="h-4 w-4" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete"
                    onClick={() => deleteConfirm.request(row)}
                    className="text-muted-2 hover:text-status-red cursor-pointer p-1.5 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteConfirm.isOpen}
        title={`Delete "${deleteConfirm.pending?.name}"?`}
        description="This can't be undone."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={handleDeleteConfirmed}
        onCancel={deleteConfirm.cancel}
      />

      <ConfirmDialog
        open={deleteSessionConfirm.isOpen}
        title={`Delete "${deleteSessionConfirm.pending?.dayLabel} • ${deleteSessionConfirm.pending?.sessionLabel}"?`}
        description="This deletes the session and every item in it. This can't be undone."
        confirmLabel="Delete Session"
        tone="danger"
        onConfirm={handleDeleteSessionConfirmed}
        onCancel={deleteSessionConfirm.cancel}
      />
    </main>
  );
}

function UploadPanel({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ sessions: ParsedSession[]; programs: ParsedProgram[]; errors: { index: number; name: string; errors: string[] }[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePreview() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/cue-sheet/upload?dryRun=1", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to parse file");
        return;
      }
      setPreview(data);
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/cue-sheet/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to import");
        return;
      }
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-surface-1 border border-[var(--color-border)] p-6 flex flex-col gap-4">
      <p className="text-[10px] uppercase tracking-[0.14em] text-tertiary font-medium">Import Excel</p>
      <input
        type="file"
        accept=".xlsx"
        onChange={(e) => {
          setFile(e.target.files?.[0] ?? null);
          setPreview(null);
        }}
        className="text-[13px] text-secondary file:mr-4 file:h-8 file:px-3.5 file:rounded-lg file:border-0 file:bg-surface-2 file:text-primary file:text-[12px] file:font-medium file:cursor-pointer cursor-pointer"
      />

      {error && <p className="text-[12px] text-status-red">{error}</p>}

      {!preview && (
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handlePreview} disabled={!file || busy}>
            {busy ? "Parsing…" : "Preview"}
          </Button>
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        </div>
      )}

      {preview && (
        <div className="flex flex-col gap-4">
          <p className="text-[13px] text-secondary">
            Parsed {preview.sessions.length} sessions, {preview.programs.length} items.
            {preview.errors.length > 0 && (
              <span className="text-status-red"> {preview.errors.length} rows have validation errors.</span>
            )}
          </p>
          {preview.errors.length > 0 && (
            <ul className="text-[11px] text-status-red flex flex-col gap-1 max-h-40 overflow-y-auto">
              {preview.errors.map((e) => (
                <li key={e.index}>
                  Row {e.index + 1} ({e.name || "untitled"}): {e.errors.join(", ")}
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center gap-3">
            <Button variant="primary" onClick={handleConfirm} disabled={busy || preview.errors.length > 0}>
              {busy ? "Importing…" : "Confirm import"}
            </Button>
            <Button variant="ghost" onClick={onCancel} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
