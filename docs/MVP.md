# MVP Scope

Built around one real, bundled cue sheet (`data/cue-sheet.xlsx`) — not a
generic importer. See `docs/DATA_MODEL.md`.

- [x] Parse the real cue sheet into normalized sessions (build-time, automatic)
- [x] Manual Next / Previous
- [x] Jump to Item
- [x] Pause / Hold
- [x] Live Sync (localStorage + BroadcastChannel stand-in for Supabase)
- [x] Session switching (event spans 6 sessions across 3 days)
- [x] Green Room Display
- [x] AV Display (audio/video/lighting requirements, not toggleable status)
- [x] Progress Indicator
- [x] Countdown (hold-aware)
- [x] Alert Banner
- [x] Stage Notes (pre-filled from the sheet, editable live)
- [x] Responsive
- [x] TV Safe Area
- [x] Dark Mode Only

Explicitly out of scope for this version: authentication, multi-event
support, multiple Excel formats, a database import pipeline, admin
management, permissions.
