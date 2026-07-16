"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Plus, Upload, Pencil, Trash2 } from "lucide-react";
import { useSessions } from "@/lib/use-sessions";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/tv/section-label";
import { ProgramForm } from "@/components/forms/program-form";
import type { ProgramInput } from "@/lib/validation/program";
import type { ParsedProgram, ParsedSession } from "@/lib/parse-cuesheet";
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
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const activeSessionId = selectedSessionId ?? sessions[0]?.id ?? "";

  const [rows, setRows] = useState<ProgramRow[] | null>(null);
  const [loadingRows, setLoadingRows] = useState(false);
  const [panel, setPanel] = useState<"none" | "upload" | "create" | { edit: ProgramRow }>("none");

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

  async function handleDelete(id: string) {
    if (!confirm("Delete this item?")) return;
    await fetch(`/api/programs/${id}`, { method: "DELETE" });
    loadRows(activeSessionId);
  }

  const sessionOptions = sessions.map((s) => ({ id: s.id, label: `${s.dayLabel} • ${s.sessionLabel}` }));

  return (
    <main className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-4">
          <Link href="/operator">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
              Operator
            </Button>
          </Link>
          <h1 className="text-title text-primary">Cue Sheet</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setPanel("upload")}>
            <Upload className="h-4 w-4" strokeWidth={2} />
            Import Excel
          </Button>
          <Button variant="primary" size="sm" onClick={() => setPanel("create")}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            Add item
          </Button>
        </div>
      </header>

      <div className="px-6 py-6 max-w-4xl mx-auto flex flex-col gap-8">
        <div>
          <SectionLabel>Session</SectionLabel>
          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
            {sessions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSelectedSessionId(s.id);
                  loadRows(s.id);
                }}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-caption font-medium cursor-pointer transition-colors",
                  s.id === activeSessionId ? "bg-card text-primary" : "text-muted-2 hover:text-primary"
                )}
              >
                {s.dayLabel} • {s.sessionLabel}
              </button>
            ))}
          </div>
        </div>

        {panel === "upload" && (
          <UploadPanel onDone={() => { setPanel("none"); if (activeSessionId) loadRows(activeSessionId); }} onCancel={() => setPanel("none")} />
        )}

        {panel === "create" && activeSessionId && (
          <div className="rounded-2xl bg-card p-6">
            <ProgramForm
              sessionId={activeSessionId}
              sessionOptions={sessionOptions}
              onSaved={() => { setPanel("none"); loadRows(activeSessionId); }}
              onCancel={() => setPanel("none")}
            />
          </div>
        )}

        {typeof panel === "object" && "edit" in panel && (
          <div className="rounded-2xl bg-card p-6">
            <ProgramForm
              sessionId={panel.edit.session_id}
              sessionOptions={sessionOptions}
              programId={panel.edit.id}
              initial={rowToInput(panel.edit)}
              onSaved={() => { setPanel("none"); loadRows(activeSessionId); }}
              onCancel={() => setPanel("none")}
            />
          </div>
        )}

        {panel === "none" && (
          <div>
            <SectionLabel>Items</SectionLabel>
            <div className="mt-3 flex flex-col">
              {loadingRows && <p className="text-body text-muted py-4">Loading…</p>}
              {!loadingRows && rows === null && (
                <p className="text-body text-muted py-4">Select a session to view its items.</p>
              )}
              {!loadingRows && rows?.length === 0 && <p className="text-body text-muted py-4">No items yet.</p>}
              {rows?.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center gap-3 py-3 px-3 rounded-lg border-b border-white/5 hover:bg-card transition-colors"
                >
                  <span className="w-8 text-caption text-muted-2 tabular-nums shrink-0">{row.sort_order}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-body text-primary truncate">{row.name}</p>
                    {row.presenter && <p className="text-caption text-muted-2 truncate">{row.presenter}</p>}
                  </div>
                  {row.status !== "confirmed" && (
                    <span className="text-caption text-muted-2 uppercase tracking-wide shrink-0">{row.status}</span>
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
                    onClick={() => handleDelete(row.id)}
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
    <div className="rounded-2xl bg-card p-6 flex flex-col gap-4">
      <SectionLabel>Import Excel</SectionLabel>
      <input
        type="file"
        accept=".xlsx"
        onChange={(e) => {
          setFile(e.target.files?.[0] ?? null);
          setPreview(null);
        }}
        className="text-body text-muted file:mr-4 file:h-9 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-background file:font-medium file:cursor-pointer cursor-pointer"
      />

      {error && <p className="text-caption text-status-red">{error}</p>}

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
          <p className="text-body text-muted">
            Parsed {preview.sessions.length} sessions, {preview.programs.length} items.
            {preview.errors.length > 0 && (
              <span className="text-status-red"> {preview.errors.length} rows have validation errors.</span>
            )}
          </p>
          {preview.errors.length > 0 && (
            <ul className="text-caption text-status-red flex flex-col gap-1 max-h-40 overflow-y-auto">
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
