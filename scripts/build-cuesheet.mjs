#!/usr/bin/env node
// Parses data/cue-sheet.xlsx (the Satsang Shibir 2026 cue sheet) into
// lib/generated/cuesheet.json. Runs automatically before `dev`/`build` via
// npm scripts so the app always reflects the bundled source file — see
// docs/DATA_MODEL.md for the column mapping this encodes.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import * as XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, "..", "data", "cue-sheet.xlsx");
const OUT_DIR = path.join(__dirname, "..", "lib", "generated");
const OUT_FILE = path.join(OUT_DIR, "cuesheet.json");

function norm(s) {
  return (s ?? "").toString().replace(/\r\n/g, " ").replace(/\s+/g, " ").trim();
}

function excelTimeToLabel(fraction) {
  if (typeof fraction !== "number") return null;
  const totalMinutes = Math.round(fraction * 1440);
  let hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${String(minutes).padStart(2, "0")} ${period}`;
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Strips a trailing "[...]" production aside out of a title (it reads as an
// internal suggestion, not part of the title) and returns it separately so
// callers can fold it into notes instead of just discarding it.
function stripBracketAside(text) {
  const match = text.match(/\s*\[([^\]]+)\]\s*$/);
  if (!match) return { clean: text, aside: null };
  return { clean: norm(text.slice(0, match.index)), aside: match[1].trim() };
}

function prettifyItemCode(code) {
  if (!code) return "";
  return norm(code)
    .replace(/[*]+$/g, "")
    .replace(/-\d+(\.\d+)?$/g, "")
    .replace(/-/g, " ")
    .trim();
}

// A bare-label row (non-numeric "#") is either a section/day divider
// (grouping context for following items) or a real break/meal item that
// belongs in the live sequence. Classified by keyword — verified against
// every divider row in this specific file (see docs/DATA_MODEL.md).
function isBreakLabel(text) {
  return /break|breakfast|lunch|dinner|end of day|depart/i.test(text);
}

function isSectionLabel(text) {
  return /^day\s+\d/i.test(text) || /section\s*\d/i.test(text) || norm(text).toLowerCase() === "conclusion";
}

function resolveColumns(rows) {
  const r1 = (rows[1] || []).map(norm);
  const r2 = (rows[2] || []).map(norm);
  const width = Math.max(r1.length, r2.length);
  const labelAt = {};
  for (let c = 0; c < width; c++) {
    labelAt[c] = r2[c] || r1[c];
  }
  const find = (...labels) => {
    for (let c = 0; c < width; c++) {
      if (labels.includes(labelAt[c])) return c;
    }
    return -1;
  };
  return {
    order: find("#"),
    startTime: find("Start Time"),
    endTime: find("End Time"),
    duration: find("Duration (Min)", "Duration"),
    item: find("Item"),
    description: find("Description"),
    presenter: find("Presenter"),
    mic: find("Mics (wireless/ stage/podium)"),
    audioTrack: find("Audio"),
    sidescreen: find("Sidescreens"),
    backdrop: find("Backdrop"),
    pptSide: find("Side"),
    hallLights: find("Hall Lights"),
    stageLights: find("Stage/Speaker Lights"),
    curtains: find("Curtains"),
    stageNotes: find("Stage Left + Right Notes"),
    team: find("Team Involvement"),
    notes: find("Notes"),
  };
}

function parseTitleTripleAndSession(sheetName, titleCellRaw) {
  const lines = (titleCellRaw ?? "").toString().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  // Expect: ["Satsang Shibir 2026", "Theme: ...", "Friday | Evening Session"]
  const last = lines[lines.length - 1] ?? sheetName;
  const [dayLabel, sessionLabel] = last.split("|").map((s) => s.trim());
  return {
    eventName: lines[0] ?? "Satsang Shibir 2026",
    dayLabel: dayLabel ?? sheetName,
    sessionLabel: sessionLabel ?? "",
  };
}

function parseSheet(sheetName, sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const cols = resolveColumns(rows);
  const { eventName, dayLabel, sessionLabel } = parseTitleTripleAndSession(sheetName, rows[0]?.[0]);

  const items = [];
  let currentSection = null;
  let order = 0;

  for (let i = 3; i < rows.length; i++) {
    const row = rows[i];
    const col0 = row[cols.order];

    if (typeof col0 === "number") {
      order += 1;
      const startFrac = row[cols.startTime];
      const endFrac = row[cols.endTime];
      const durFrac = row[cols.duration];
      let durationMinutes = typeof durFrac === "number" ? Math.round(durFrac * 1440) : 0;
      if (!durationMinutes && typeof startFrac === "number" && typeof endFrac === "number") {
        durationMinutes = Math.round((endFrac - startFrac) * 1440);
      }

      const itemCode = norm(row[cols.item]);
      // "See Notes…" is a placeholder pointing at the Notes column, not a
      // real title — fall through to the itemCode-derived title for it.
      const rawDescription = norm(row[cols.description]);
      const description = /^see notes/i.test(rawDescription) ? "" : rawDescription;
      let title = "";
      let kicker = null;
      if (description.includes("|")) {
        const idx = description.indexOf("|");
        kicker = description.slice(0, idx).trim() || null;
        title = description.slice(idx + 1).trim();
      } else if (description) {
        title = description;
      } else {
        title = prettifyItemCode(itemCode) || "Untitled";
      }

      const sidescreenRaw = norm(row[cols.sidescreen]);
      const pptSideRaw = norm(row[cols.pptSide]);

      items.push({
        id: "",
        order,
        type: "item",
        title,
        kicker,
        itemCode: itemCode || null,
        presenter: norm(row[cols.presenter]) || null,
        sectionLabel: currentSection,
        scheduledStart: excelTimeToLabel(startFrac),
        scheduledEnd: excelTimeToLabel(endFrac),
        durationMinutes,
        audio: {
          mic: norm(row[cols.mic]) === "Y",
          track: norm(row[cols.audioTrack]) === "Y",
        },
        video: {
          sidescreen: sidescreenRaw === "Live Feed" ? "live_feed" : sidescreenRaw === "Y" ? "slides" : "none",
          backdrop: norm(row[cols.backdrop]) === "Y",
          pptSide: pptSideRaw.startsWith("Y"),
        },
        lights: {
          hall: norm(row[cols.hallLights]) || null,
          stage: cols.stageLights >= 0 ? normalizeLight(norm(row[cols.stageLights])) : null,
        },
        curtains: cols.curtains >= 0 ? normalizeCurtain(norm(row[cols.curtains])) : null,
        stageNotes: cols.stageNotes >= 0 ? norm(row[cols.stageNotes]) || null : null,
        team: norm(row[cols.team]) || null,
        notes: norm(row[cols.notes]) || null,
      });
      continue;
    }

    const label = norm(col0);
    if (!label || label === "Duration") continue; // footer totals row, skip entirely

    if (isBreakLabel(label)) {
      order += 1;
      const { clean, aside } = stripBracketAside(label);
      items.push({
        id: "",
        order,
        type: "break",
        title: clean,
        kicker: null,
        itemCode: null,
        presenter: null,
        sectionLabel: currentSection,
        scheduledStart: null,
        scheduledEnd: null,
        durationMinutes: 0,
        audio: { mic: false, track: false },
        video: { sidescreen: "none", backdrop: false, pptSide: false },
        lights: { hall: null, stage: null },
        curtains: null,
        stageNotes: null,
        team: null,
        notes: aside,
      });
    } else if (isSectionLabel(label)) {
      currentSection = label;
    }
    // Any other stray label row is ignored (defensive default).
  }

  const id = slugify(`${dayLabel}-${sessionLabel}`);
  for (const it of items) it.id = `${id}-${it.order}`;

  return { id, sheetName, eventName, dayLabel, sessionLabel, items };
}

function normalizeLight(v) {
  if (!v) return null;
  if (v.toLowerCase() === "on") return "ON";
  if (v.toLowerCase() === "off") return "OFF";
  return v;
}

function normalizeCurtain(v) {
  if (v === "Closed") return "closed";
  if (v === "Open") return "open";
  return null;
}

function main() {
  const buffer = readFileSync(SRC);
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sessions = wb.SheetNames.map((name) => parseSheet(name, wb.Sheets[name]));

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify({ generatedAt: new Date().toISOString(), sessions }, null, 2));

  const totalItems = sessions.reduce((n, s) => n + s.items.length, 0);
  console.log(`[build-cuesheet] wrote ${sessions.length} sessions, ${totalItems} items -> ${path.relative(process.cwd(), OUT_FILE)}`);
}

main();
