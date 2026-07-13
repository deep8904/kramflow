# KramFlow

**Order in motion.** A live event operating system for running multi-day, multi-session programs — built for stage managers, AV operators, green rooms, and performers, across Smart TVs, desktop, and mobile.

> क्रम (*Krama*) — sequence, order, progression, flow.

KramFlow answers exactly two questions, everywhere it's displayed: **what's happening now, and what happens next.** No spreadsheets, no dashboards full of charts — just the run of show, live, on whatever screen you're looking at.

---

## Overview

Live events run on a spreadsheet that gets shouted across a green room. KramFlow replaces that with four purpose-built surfaces reading from one shared, real-time program state:

- **Operator Dashboard** — a desktop control room for the person running the show
- **Operator Remote** — a one-handed mobile controller for walking backstage
- **Green Room Display** — a TV performers glance at while getting ready
- **AV Waiting Room Display** — a TV showing technical requirements for what's next

All four stay in sync. Advance the program from a phone backstage, and every TV in the building updates within about a second.

## Features

- **Real cue-sheet-driven data** — the actual event program (`data/cue-sheet.xlsx`) is parsed at build time into typed, normalized sessions. No manual data entry, no generic import UI to fight with.
- **Session-aware control** — the event spans multiple days and sessions; the operator switches between them, and each session remembers its own progress independently.
- **Next / Previous / Jump to Item** — full control over what's live, with input validation on jump targets.
- **Pause / Hold** — freezes the countdown across every connected display in lockstep, and resumes exactly where it left off (no time lost or gained).
- **Live alerts** — post a message with a severity level; it appears instantly on every TV and the operator's own screen.
- **Editable stage notes** — pre-filled from the cue sheet, editable live without touching the source file.
- **Four dedicated interfaces, not one responsive page** — TV, desktop, and mobile each get a layout designed for how that surface is actually used.
- **PIN-gated control surfaces** — `/operator` and `/remote` require a 4-digit PIN, checked server-side; the TV displays stay public.
- **Dark mode only, TV-legible typography** — designed to be read from 5–15 feet away on a 1920×1080 display, and to feel calm rather than like an admin panel.

## Screenshots

_Coming soon — screenshots of the Operator Dashboard, Remote, Green Room, and AV displays will go here._

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| UI | [React 19](https://react.dev), [TypeScript](https://www.typescriptlang.org) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Motion | [Framer Motion](https://www.framer.com/motion/) |
| Icons | [Lucide](https://lucide.dev) |
| Cue sheet parsing | [SheetJS (`xlsx`)](https://sheetjs.com) — build-time only, never shipped to the client |
| State sync | `localStorage` + `BroadcastChannel` (interim — see [Architecture](#architecture)) |
| Auth | A minimal server-side PIN check (see [Security](#security)) |
| Deployment | [Vercel](https://vercel.com) |

## Installation

Requires Node.js ≥20.9 and npm.

```bash
git clone https://github.com/deep8904/kramflow.git
cd kramflow
npm install
```

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll land on a launcher linking to all four surfaces:

- `/operator` — desktop control room (PIN-protected)
- `/remote` — mobile controller (PIN-protected)
- `/green-room` — performer TV display (public)
- `/av` — AV crew TV display (public)

The default PIN is `0065` (see [Environment Variables](#environment-variables) to change it).

## Development

`npm run dev` automatically regenerates `lib/generated/cuesheet.json` from `data/cue-sheet.xlsx` before starting (via the `predev` script), so the app always reflects the bundled cue sheet. If you edit the source spreadsheet, just restart dev — no manual rebuild step.

To regenerate the parsed data without starting the dev server:

```bash
npm run cuesheet:build
```

Useful things to know before making changes:

- **Read `docs/DATA_MODEL.md` first** if you're touching the parser (`scripts/build-cuesheet.mjs`) — it documents the exact column mapping and the quirks of the source file.
- **Read `docs/DESIGN_SYSTEM.md`** before touching layout — each of the four surfaces has its own deliberate layout logic; "just shrink the desktop version" is explicitly the wrong move for mobile/TV.
- State flows through `lib/store.tsx`'s `useEventStore()` hook exclusively — no component reads `localStorage` directly.

## Folder Structure

```text
kramflow/
├── app/
│   ├── (display)/
│   │   ├── green-room/page.tsx   — performer TV, public, full-bleed
│   │   └── av/page.tsx           — AV crew TV, public, full-bleed
│   ├── (operator)/
│   │   ├── layout.tsx            — wraps operator + remote in the PIN gate
│   │   ├── operator/page.tsx     — desktop control room
│   │   └── remote/page.tsx       — one-handed mobile controller
│   ├── api/auth/route.ts         — server-side PIN check
│   ├── layout.tsx / page.tsx     — root layout + launcher
│   └── globals.css               — design tokens, dark theme
├── components/
│   ├── auth/                     — PIN gate + session auth context
│   ├── operator/                 — desktop dashboard building blocks
│   ├── remote/                   — mobile-only components
│   ├── tv/                       — shared TV display primitives
│   └── ui/                       — generic button/input/card/badge
├── lib/
│   ├── store.tsx                 — live state (sync, not reference data)
│   ├── types.ts                  — Program/Session/LiveState + selectors
│   ├── cuesheet.ts                — loads the generated JSON
│   ├── use-countdown.ts          — hold-aware countdown hook
│   └── generated/cuesheet.json   — build output, gitignored
├── data/cue-sheet.xlsx           — the real source of truth for program data
├── scripts/build-cuesheet.mjs    — parses the xlsx into normalized JSON
└── docs/                         — architecture, design system, deployment, etc.
```

## Architecture

Two data layers, deliberately kept separate:

1. **Reference data** — static, generated at build time from `data/cue-sheet.xlsx`, never mutated at runtime. ~250 cues across 6 sessions.
2. **Live state** — small and mutable: which session is active, current position per session, hold state, the active alert, and any note overrides. This is what actually syncs between displays.

Sync currently runs over `localStorage` + `BroadcastChannel` — a stand-in for Supabase Realtime, which is the next planned step (see `docs/ARCHITECTURE.md` and [Roadmap](#roadmap)). Every component reaches this state through one hook (`useEventStore()`), so swapping the sync backend is a one-file change.

Full details: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md).

## Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `OPERATOR_PIN` | No | `0065` | 4-digit PIN gating `/operator` and `/remote`. Checked server-side only (`app/api/auth/route.ts`) — never sent to the client. |

Copy `.env.example` to `.env.local` and set a real value before deploying:

```bash
cp .env.example .env.local
```

## Security

`/operator` and `/remote` are gated by a 4-digit PIN, entered via an on-screen keypad or the keyboard. The PIN is checked by a server-side route handler and never appears in client-side code or the browser bundle. Once entered correctly, access persists for the current browser session (`sessionStorage`) — closing the browser or restarting requires it again, and a "Lock" button in both surfaces clears it immediately.

This is a **convenience gate for a small trusted crew**, not production-grade authentication: no hashing, no rate limiting, no per-user accounts or audit trail. A real deployment protecting sensitive operations should replace this with proper authentication (e.g., signed sessions, a real user/credential system, or an identity provider) — see `docs/DEPLOYMENT.md`.

The Green Room and AV displays are intentionally public — they're read-only and meant to be visible on TVs in shared spaces.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server (auto-regenerates cue sheet data first) |
| `npm run build` | Production build (auto-regenerates cue sheet data first) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run cuesheet:build` | Regenerate `lib/generated/cuesheet.json` from `data/cue-sheet.xlsx` without starting anything |

## Deployment

Deploys to Vercel with zero configuration beyond the environment variable above — see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the full checklist, including what a production-hardened auth setup would add.

## Brand Identity

KramFlow's name and meaning are final; the visual identity (logo, icon set, favicons) is **not yet implemented** — this codebase currently runs on placeholder/inherited assets. See [`docs/BRAND_GUIDELINES.md`](docs/BRAND_GUIDELINES.md) for the naming rationale and what's pending.

## Design System

Four surfaces, four layout strategies — TV is full-bleed with hero typography and zero controls, the desktop dashboard is a dense three-column control room, and the mobile remote is a purpose-built one-handed controller, not a shrunk dashboard. Full rationale, type scale, spacing, and color tokens: [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md).

## Contributing

See [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) for setup, conventions, and how changes are reviewed. In short: `npm run lint`, `npx tsc --noEmit`, and `npm run build` should all pass before opening a PR.

## Roadmap

```text
MVP (this codebase)
  ↓
Supabase Realtime — replace localStorage/BroadcastChannel sync
  ↓
Real brand identity — logo, favicons, PWA icons
  ↓
Generic cue sheet import — any file, not just this one event
  ↓
Multiple events
  ↓
Phone companion for performers · volunteer check-in · QR join
  ↓
Automatic cue timing · analytics
```

Full detail: [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Future Improvements

- Server-side authentication (replacing the PIN convenience gate) if KramFlow moves beyond a single trusted crew
- Supabase Realtime for true cross-device sync (current sync is same-browser only)
- Automated visual regression tests across the responsive breakpoints
- Real brand assets across every touchpoint listed in `docs/BRAND_GUIDELINES.md`

## License

Not yet licensed for public/open-source use. All rights reserved pending a license decision.

## Credits

Built for BAPS Phoenix's Satsang Shibir 2026. Cue sheet data, program structure, and event requirements courtesy of the event's production team.
