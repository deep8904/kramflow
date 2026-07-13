# Architecture

## Stack

- Next.js 15 (App Router) — Note: this repo was scaffolded with Next.js 16;
  the App Router conventions used here are compatible with both.
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- Supabase (Postgres + Realtime) — not yet wired, see below
- Vercel (hosting)
- Lucide Icons
- `xlsx`, used only at build time by `scripts/build-cuesheet.mjs`

## Route groups

```text
app/
├── (display)/
│   ├── green-room/page.tsx     — performer-facing TV, full-bleed, no controls
│   └── av/page.tsx             — AV crew-facing TV, full-bleed, no controls
├── (operator)/
│   ├── operator/page.tsx       — desktop control room, 3-column, full width
│   └── remote/page.tsx         — one-handed mobile remote, not a resized dashboard
└── layout.tsx
```

## Two data layers, on purpose

1. **Reference data — static, generated, immutable at runtime.**
   `data/cue-sheet.xlsx` → `scripts/build-cuesheet.mjs` → `lib/generated/cuesheet.json`
   → `lib/cuesheet.ts` exports typed `sessions: Session[]`. This regenerates
   automatically before `dev`/`build` (`predev`/`prebuild` in
   `package.json`) so the app always reflects the bundled source file. See
   `docs/DATA_MODEL.md` for the column mapping.
2. **Live state — small, mutable, synced across displays.**
   `LiveState` (`lib/types.ts`) holds only what actually changes during the
   event: which session is active, each session's current position, hold
   state, the active alert, and any operator note overrides. Kept
   deliberately separate from the ~250-item reference data so every sync
   write stays small.

Components never read `lib/generated/cuesheet.json` directly — they go
through `getSessionById()` for reference data and `useEventStore()` for live
state, then combine them with `getLive`/`getNext`/`getOnDeck` from
`lib/types.ts`.

## State flow

1. Operator actions (Next/Previous/Jump/Hold/Alert/session switch) call
   `lib/store.tsx`'s `useEventStore()`, which commits a new `LiveState`.
2. `commit()` writes to `localStorage` and posts to a `BroadcastChannel`, so
   every open display picks up the change — this is a stand-in for Supabase
   Realtime, not the final architecture. Swapping `lib/store.tsx`'s internals
   for Supabase should not require changing any component, since they only
   ever call `useEventStore()`.
3. Display surfaces are pure renderers of `{ session, liveState }` — they
   hold no local mutable program state, only animation state.

## Pause / Hold

`LiveState.pausedAt` is the timestamp a hold began, not a boolean. Freezing
the countdown just means every display computes elapsed time against
`pausedAt` instead of the live clock while it's set (`lib/use-countdown.ts`).
Resuming shifts the active item's `startedAt` forward by the paused
duration, so the countdown picks up exactly where it left off — this keeps
every display in lockstep without needing per-client pause bookkeeping.
