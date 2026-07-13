# Data Model

KramFlow is built around one real source file: `data/cue-sheet.xlsx`, the
Satsang Shibir 2026 cue sheet. `scripts/build-cuesheet.mjs` parses it into
`lib/generated/cuesheet.json` automatically before every `dev`/`build` (see
`predev`/`prebuild` in `package.json`). The raw spreadsheet is never shipped
to the client or shown to users — only the normalized data below is.

## Source file shape

Each sheet (tab) is one **Session** — Fri Evening, Sat Morning 1&2, Sat
Afternoon, Sat Evening 1&2, Sun Morning 1&2, Sun Afternoon. Every sheet
shares the same column layout, with two quirks the parser handles:

- Friday Evening has an extra "Curtains" column the others don't. Columns
  are resolved by header text, not position, so this doesn't break parsing.
- The "#" column (order) restarts at 0 partway through a few sheets, where
  one sheet actually contains two sub-sessions (e.g. "Morning Session 1 & 2"
  back to back). The parser assigns its own contiguous `order` per session
  and ignores the raw "#".

Row types the parser distinguishes:

| Row shape | Meaning | Result |
|---|---|---|
| Numeric "#" | A real cue | `Program` with `type: "item"` |
| Text spanning the row, keyword like "Break"/"Lunch"/"Dinner"/"End of Day" | A meal or transition | `Program` with `type: "break"` |
| Text spanning the row, matches `Day \d`, `Section \d`, or "Conclusion" | Grouping context, not a moment in time | Attached as `sectionLabel` to the following items, not its own row |
| First cell literally "Duration" | Spreadsheet's own totals footer | Skipped entirely |

## Program

| Field | Type | Source |
|---|---|---|
| `id` | `string` | `${sessionId}-${order}` |
| `order` | `number` | Assigned sequentially per session (not the raw "#") |
| `type` | `"item" \| "break"` | Row classification above |
| `title` | `string` | `Description` column; split on the first `\|` into `kicker` + `title` when present (e.g. `"Shāstriji Mahārāj \| Prabhāv..."` → kicker "Shāstriji Mahārāj", title "Prabhāv..."). Falls back to a cleaned `Item` code when Description is empty or a "See Notes…" placeholder. |
| `kicker` | `string \| null` | See above — the theme/topic prefix, shown as a small line above the title |
| `itemCode` | `string \| null` | Raw `Item` column (e.g. `"Skit-1.2"`) — internal reference only, never shown on a TV |
| `presenter` | `string \| null` | `Presenter` column |
| `sectionLabel` | `string \| null` | Nearest preceding section/day divider, used to group the operator's list |
| `scheduledStart` / `scheduledEnd` | `string \| null` | `Start Time`/`End Time` columns (Excel time fractions) formatted as `"5:00 PM"` — informational only, the operator's Next/Previous is what actually drives the show |
| `durationMinutes` | `number` | `Duration (Min)` column, or `End - Start` if that's blank; drives the live countdown |
| `audio` | `{ mic, track }` | "Mics (wireless/stage/podium)" and "Audio" sub-columns, `Y`/`-` → boolean |
| `video` | `{ sidescreen, backdrop, pptSide }` | "Sidescreens" (`Y`/`Live Feed`/`-`), "Backdrop", "Side" (PPT) columns |
| `lights` | `{ hall, stage }` | "Hall Lights" / "Stage/Speaker Lights" — kept as their raw label (`ON`, `OFF`, `Dim`, `Podium`, `Stage Lights`, …) since this column isn't a clean boolean in the source |
| `curtains` | `"open" \| "closed" \| null` | "Curtains" column (Friday only) |
| `stageNotes` | `string \| null` | "Stage Left + Right Notes" column — empty in every row of this file, but the field exists so future cue sheets that populate it show up automatically on the Green Room's Entrance line |
| `team` | `string \| null` | "Team Involvement" column |
| `notes` | `string \| null` | "Notes" column — the operator can add to/override this live without touching the source file (see `LiveState.notesOverrides`) |

## Session

`{ id, sheetName, eventName, dayLabel, sessionLabel, items: Program[] }` —
`dayLabel`/`sessionLabel` come from the sheet's own title cell (e.g.
`"Saturday | Morning Session 1 & 2"`).

## Live state (mutable, synced across displays)

Session/Program data above is static reference data generated at build time.
What actually changes during the event lives in `LiveState`
(`lib/types.ts`), kept small on purpose so it's cheap to sync:

```ts
{
  activeSessionId: string;              // which of the 6 sessions is live
  progressBySession: Record<string, {   // remembers where each session left off
    currentOrder: number | null;
    startedAt: string | null;
  }>;
  pausedAt: string | null;              // Hold — see ARCHITECTURE.md
  alert: Alert | null;
  notesOverrides: Record<string, string>; // programId -> operator-edited notes
}
```

`getLive` / `getNext` / `getOnDeck` (in `lib/types.ts`) derive the three
displayed items from a `Session` + the active `SessionProgress` — no
component ever reaches into raw JSON directly.
