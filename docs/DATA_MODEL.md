# Data Model

KramFlow's reference data (`sessions`, `programs`) and live state
(`live_state`) live in Supabase Postgres — see `supabase/schema.sql` for
the authoritative schema and `docs/ARCHITECTURE.md` for why. This replaces
the earlier build-time-JSON-from-a-bundled-spreadsheet model: the cue
sheet is dynamic now, editable at runtime via Excel upload or an ad-hoc
item form, not baked in at build time.

## Getting data in

Two paths, both going through `lib/parse-cuesheet.ts` (Excel) or
`lib/validation/program.ts` (form) — see below:

1. **Initial load** — `npm run seed` parses `data/cue-sheet.xlsx` (or any
   `.xlsx` at that path) and upserts it into Supabase. Run once against a
   fresh project, or again to reset from the bundled file.
2. **Runtime** — an operator uploads a `.xlsx` from `/operator/cue-sheet`
   (parsed + validated with a dry-run preview before committing —
   `app/api/cue-sheet/upload/route.ts`), or adds/edits a single item via
   the form (`components/forms/program-form.tsx`, `app/api/programs/*`).
   Both go through the same `lib/validation/program.ts` Zod schema, so the
   column list and its constraints are defined exactly once.

## Source file shape (Excel import)

Each sheet (tab) is one **Session**. Columns are resolved by header text,
not position, via `lib/parse-cuesheet.ts`'s `resolveColumns()` — this is
what lets a re-uploaded or reordered spreadsheet still parse correctly.

| Row shape | Meaning | Result |
|---|---|---|
| Numeric "#" | A real cue | `programs` row with `type: "item"` |
| Text spanning the row, keyword like "Break"/"Lunch"/"Dinner"/"End of Day" | A meal or transition | `programs` row with `type: "break"` |
| Text spanning the row, matches `Day \d`, `Section \d`, or "Conclusion" | Grouping context, not a moment in time | Attached as `section_label` to the following items, not its own row |
| First cell literally "Duration" | Spreadsheet's own totals footer | Skipped entirely |

## `programs` table

The fixed column list — single source of truth in
`lib/validation/program.ts` (`programInputSchema`/`programRowSchema`) and
`supabase/schema.sql`:

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `sort_order` | `int` | Sequence position — separate from `id` so reordering never touches primary keys |
| `session_id` | `text` | FK → `sessions.id` |
| `section_label` | `text \| null` | Day/Section grouping header for the rundown list |
| `type` | `"item" \| "break"` | |
| `name` | `text` | Item/program name |
| `description` | `text \| null` | |
| `presenter` | `text \| null` | |
| `presenter_requirement` | `text \| null` | |
| `presenter_contact` | `text \| null` | Phone/walkie — lets Green Room page a late presenter |
| `duration` | `int` | Minutes |
| `start_time` / `end_time` | `text \| null` | Pre-formatted display strings (`"5:00 PM"`), not timestamps — informational only |
| `audio_mics` / `audio_track` | `boolean` | |
| `video_sidescreen` | `"none" \| "slides" \| "live_feed"` | |
| `backdrop` | `boolean` | |
| `video_ppt_needed` | `boolean` | AV crew's "does this item need PPT shown at all" flag — unrelated to any presenter-facing slide rendering (out of scope, see the restructure plan) |
| `hall_lights` / `stage_lights` | `text \| null` | |
| `camera_angle` | `text \| null` | Live-feed camera angle, shown on the AV display |
| `props` | `text \| null` | Left/right placement, shown on the Green Room props panel |
| `curtains` | `"open" \| "closed" \| null` | |
| `remarks` | `text \| null` | Operator-editable notes |
| `status` | `"confirmed" \| "draft" \| "cut" \| "tbd"` | Lets an item be staged without going live |
| `color_tag` | `text \| null` | Visual flag for critical cues on the operator's rundown list |
| `created_at` / `updated_at` / `updated_by` | | Audit trail |

## `sessions` table

`id, sheet_name, event_name, day_label, session_label, sort_order`.

## App-shape mapping

Components never read Supabase rows directly — `lib/data/sessions.ts`'s
`mapProgramRow()`/`fetchSessions()` map DB rows into the `Program`/`Session`
shapes in `lib/types.ts`, which every component actually consumes via
`useSessions()`/`getSessionById()`. A few `Program` fields (`kicker`,
`itemCode`, `team`) predate the current schema and have no DB column
anymore — they're kept on the type as legacy-nullable rather than ripped
out, since removing them would also mean touching every display that
still reads them.

## Live state (mutable, synced across displays)

```ts
{
  activeSessionId: string;              // which session is live
  progressBySession: Record<string, {   // remembers where each session left off
    currentOrder: number | null;
    startedAt: string | null;
  }>;
  pausedAt: string | null;              // Hold — see ARCHITECTURE.md
  alert: Alert | null;
  notesOverrides: Record<string, string>; // programId -> operator-edited notes
}
```

Backed by the `live_state` singleton row (`supabase/schema.sql`) — a
`presenter_state jsonb` column also exists on that row for the Display
Engine's Presenter-facing comment/flash channel, distinct from the
audience-facing `alert` above.

`getLive` / `getNext` / `getOnDeck` (in `lib/types.ts`) derive the three
displayed items from a `Session` + the active `SessionProgress` — no
component ever reaches into raw rows directly.
