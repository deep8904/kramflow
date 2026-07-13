# StageFlow

A real-time production dashboard for BAPS Phoenix, built around the Satsang
Shibir 2026 cue sheet (`data/cue-sheet.xlsx`) — six sessions across three
days, ~250 cues total.

## Purpose

StageFlow replaces the run-of-show spreadsheet that gets shouted across a green
room. It is a real-time production companion designed for Smart TVs placed in:

- Green Room
- AV Waiting Area

The application answers exactly two questions, and nothing else:

1. **What is happening now?**
2. **What happens next?**

## Non-goals

- No spreadsheets should ever be visible on a display.
- No analytics, historical reporting, or attendance tracking.
- No login-heavy, settings-heavy admin experience on the TV surfaces.

## Constraints

- The display must be readable from 15 feet away, on a 1080p Smart TV.
- Everything on screen should be understandable in under 3 seconds — no
  scanning, no scrolling, no interpretation required.
- The UI should feel closer to Apple TV than to Microsoft Excel.
- Dark mode only. There is no light theme.

## Audience

| Surface | Who | Needs |
|---|---|---|
| Operator Dashboard | Stage manager / operator | Switch sessions, control what's live, jump ahead, hold, post alerts, see everything |
| Green Room Display | Performers | What's live, what's next, when to walk to stage |
| AV Display | Audio/video/lighting crew | What's live, what's next, technical requirements for the next cue |

## Success criteria

- A performer glancing at the Green Room TV from across the room can answer
  "am I on soon?" without walking closer.
- An operator can advance the program, jump to any item, or raise an alert in
  under two taps/clicks.
- All connected displays update within ~1 second of an operator action.
