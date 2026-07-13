# Information Architecture

Every TV surface follows the same strict vertical hierarchy. Nothing else is
allowed on screen.

```text
TV

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

Nothing else.

- **LIVE NOW** — the single item currently happening. Title, presenter, and a
  progress/countdown if the item has a duration.
- **NEXT** — the single item immediately following. A "prepare now" cue when
  applicable.
- **ON DECK** — the item after that. Title only, muted.
- **STATUS** — surface-specific readiness state (Green Room: entrance/location;
  AV: audio/video/lights readiness).
- **ALERT** — a dismissible banner, only rendered when an alert is active.
  Absent otherwise — it does not reserve empty space.
- **PROGRESS** — a single footer line: `Day 1 • Session 2` and `17 / 42`.

Never show more than three upcoming items (Live, Next, On Deck) at once.
