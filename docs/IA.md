# Information Architecture

StageFlow is four distinct experiences, not one page that resizes. Each is
optimized for its device and its user — see `docs/DESIGN_SYSTEM.md` for the
full rationale.

| Surface | Route | Device | User |
|---|---|---|---|
| Operator Dashboard | `/operator` | Desktop/laptop | Stage manager running the show from a fixed position |
| Operator Remote | `/remote` | Phone | Same operator, walking backstage, one hand |
| Green Room Display | `/green-room` | 1920×1080 TV | Performers glancing up while getting ready |
| AV Waiting Room Display | `/av` | 1920×1080 TV | AV crew, program leads, speakers waiting to go on |

## TV surfaces (Green Room, AV)

Full-bleed — no centered container, no max-width. Content sits in a fixed
~48–64px safe-area margin (`.tv-safe-area`) and nothing else. Same strict
vertical hierarchy on both, nothing extra:

```text
LIVE NOW
  ↓
NEXT
  ↓
ON DECK
  ↓
STATUS
  ↓
ALERT
  ↓
PROGRESS
```

- **LIVE NOW** — the single item currently happening. Kicker (if any), title,
  presenter, and a countdown if the item has a duration. Hero-scale (84px).
- **NEXT** — the single item immediately following. A "Prepare Now" cue on
  Green Room only, and only for real items — never for a break.
- **ON DECK** — the item after that. Title only, muted.
- **STATUS** — surface-specific, read-only:
  - Green Room: Entrance (stage-left/right notes), when the source data has them.
  - AV: Audio Needed / Video Needed / Mic Required / Stage Notes for whatever's
    next — these are fixed technical requirements from the cue sheet, not a
    live-toggleable readiness status.
- **ALERT** — a banner, only rendered when an alert is active. Absent
  otherwise — it does not reserve empty space.
- **PROGRESS** — day/session label, item count, and a slim progress bar.

No controls on either TV surface. No buttons, no editing, no navigation —
performers and crew only ever look, never touch.

Never show more than three upcoming items (Live, Next, On Deck) at once.

## Operator Dashboard (`/operator`)

Full browser width, three columns, no page-level scroll — only the rundown
list scrolls internally:

```text
Header — wordmark, session switcher, links to the other 3 surfaces
┌───────────────────── 65% ─────────┬──── 20% ────┬──── 15% ────┐
│ Program Rundown (scrolls)         │ Live Details │ Controls    │
│ grouped by section, click to jump │ + Countdown  │ Next/Prev/  │
│                                    │ + Notes      │ Hold/Jump/  │
│                                    │              │ Alert       │
└────────────────────────────────────┴──────────────┴─────────────┘
Footer — progress bar
```

## Operator Remote (`/remote`)

Not a shrunk desktop — a purpose-built one-handed remote. Everything the
operator needs is reachable by thumb without navigating:

```text
Compact header — session chips, item count
  ↓
Now / Next / Countdown (read-only, centered)
  ↓
NEXT — the single largest control on screen
  ↓
Previous · Hold
  ↓
Jump · Alert · Notes — tap to expand an inline panel, no navigation
```
