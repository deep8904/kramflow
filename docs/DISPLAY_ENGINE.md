# KramFlow Display Engine

A centralized real-time display subsystem, built additively on `feature/kramflow-display-engine` without modifying the existing StageFlow-era app. It is the foundation for the Presenter Confidence Monitor, Green Room / AV / Lobby / Volunteer displays, and any future display type.

Everything here is off by default — see [Feature flag](#feature-flag).

## Design intent

Long-distance readability, huge typography, a single confidence-monitor mental model applied consistently across display types — inspired by the *usability principles* of tools like StageTimer (countdown/count-up, overtime awareness, fullscreen, distraction-free), not their interface. Nothing here reuses StageTimer's layout, colors, or branding; it follows KramFlow's own design tokens (`app/globals.css`) and the same "one accent color, no gradients, no decorative motion" discipline as the rest of the app, with one documented exception (see [Timer colors](#timer-colors)).

## Isolation from the existing app

Nothing under `lib/display-engine/`, `components/display-engine/`, `app/displays/`, `app/(operator)/broadcast/`, `app/(operator)/display-manager/`, or `app/api/display-engine/` is imported by, or shares storage/state with, the pre-existing app. The only touched existing file is `app/page.tsx` (an additive, flag-gated launcher section). Confirm at any time with:

```bash
git diff main --stat -- . ':!app/page.tsx'   # should be empty
```

Program/session data is never duplicated — every display page reads the same `useEventStore()`, `getSessionById()`, `getLive()`/`getNext()`/`getOnDeck()` the existing Operator Dashboard uses. The engine only owns state with no existing equivalent: the display registry, groups, profiles, its own timer/hold state, broadcasts, and the `speakerReady` flag.

Storage keys are namespaced separately from the main app's `stageflow.live` / `stageflow-sync`:

| Purpose | Key |
|---|---|
| Engine state (localStorage) | `kramflow.display-engine.v1` |
| Per-tab client id (sessionStorage) | `kramflow.display-engine.client-id` |
| BroadcastChannel name | `kramflow-display-engine` |
| Fullscreen preference (localStorage) | `kramflow.display-engine.fullscreen-preference` |

## Feature flag

The launcher (`app/page.tsx`) only shows Display Engine tiles when `NEXT_PUBLIC_DISPLAY_ENGINE_ENABLED=1` at **build time** — the route itself (`/`) is statically prerendered, so the flag must be set before `next build`, not just before `next start`. The routes themselves (`/displays/*`, `/broadcast`, `/display-manager`) are always reachable directly by URL regardless of the flag; the flag only controls launcher visibility.

## Module map

```text
lib/display-engine/
├── types.ts                 — all engine types; imports/re-exports AlertSeverity from @/lib/types rather than redefining
├── defaults.ts               — BUILT_IN_PROFILES, createInitialEngineState()
├── transport.ts               — RealtimeTransport interface + BroadcastChannel/WebSocket implementations
├── store.tsx                 — useDisplayEngine(), useTransportStatus(), targetMatchesDisplay()
├── colors.ts                  — TIMER_COLORS / TIMER_COLOR_LABELS
├── use-time-sync.ts            — Cristian's-algorithm clock sync against /api/display-engine/time
├── use-register-display.ts      — registry registration + heartbeat + pending-command delivery
├── use-display-timer.ts         — the timer engine (auto-follow + manual), formatClock(), useDisplayClock()
├── use-fullscreen.ts            — Fullscreen API + Screen Wake Lock API wrappers
├── use-keyboard-shortcuts.ts     — scoped per-page shortcut map
└── use-idle-visibility.ts        — controls auto-hide/reveal on activity

components/display-engine/
├── display-shell.tsx        — full-viewport safe-area wrapper (not a reuse of components/tv/tv-layout.tsx)
├── timer-ring.tsx            — SVG progress ring, Framer Motion (not styled-jsx — see Known constraints)
├── hold-screen.tsx            — full-screen Hold takeover
├── broadcast-overlay.tsx       — renders active broadcasts targeted at a display (banner or emergency takeover)
├── session-timeline.tsx        — shared running-order list (Lobby/Volunteer/AV)
└── profile-editor.tsx          — Display Profiles CRUD, embedded in Display Manager

app/displays/{presenter,green-room,av,lobby,volunteer}/page.tsx   — the five display surfaces
app/(operator)/broadcast/page.tsx        — Broadcast Center (PIN-gated via the existing (operator) layout)
app/(operator)/display-manager/page.tsx    — Display Manager (PIN-gated via the existing (operator) layout)
app/api/display-engine/time/route.ts       — { serverTime } for clock sync
scripts/display-engine-ws-server.mjs        — optional standalone WS relay, see below
```

## Real-time transport

`RealtimeTransport` (`transport.ts`) is the single abstraction every hook/component talks to:

- **`BroadcastChannelTransport`** (default) — zero-config, same pattern already proven in `lib/store.tsx`. Syncs every tab in the *same browser*, which is why all the cross-tab testing in this doc works without any server. Does **not** sync across separate devices/browsers.
- **`WebSocketTransport`** — a real client with reconnect/backoff (`500ms → 15s`) and message queueing while disconnected. Activated automatically when `NEXT_PUBLIC_DISPLAY_ENGINE_WS_URL` is set. This is the path for genuine cross-device sync (a phone and a lobby TV in different rooms).

### Optional WS relay server

`scripts/display-engine-ws-server.mjs` is a minimal, **dependency-free** reference relay (no `ws` package — hand-rolled RFC 6455 handshake/framing over `node:http`, verified end-to-end with a real two-client handshake+broadcast test). Its entire contract: broadcast every message it receives to every *other* connected client, verbatim.

```bash
node scripts/display-engine-ws-server.mjs 8787
# then, on every device you want synced:
NEXT_PUBLIC_DISPLAY_ENGINE_WS_URL=wss://your-host:8787
```

Suitable for small-scale internal use on a trusted network — no auth, no built-in TLS (put it behind a reverse proxy for `wss://`).

## Timer engine

`useDisplayTimer()` drives every timer-bearing display from one of two sources, selected by `engine.timer.source`:

- **Auto** — reads the *existing* app's live program (`durationMinutes`, `progress.startedAt`, `LiveState.pausedAt`). This is what "auto-follows the Operator Dashboard" means concretely: no separate program state, just the same numbers every other display already reads.
- **Manual** — the engine's own independent `TimerState`, driven by the Presenter Display's controls (start/pause/resume/reset/±30s/±1min), using the identical shift-on-resume model as the main app's own Hold (`pausedAt` shifts `startedAt` forward by the paused duration on resume, so every display's countdown stays in lockstep).

### Timer colors

Green/orange/red reuse the exact hex values already in `app/globals.css`. **Yellow is new** — a confidence monitor needs a 5-step escalation (on-time → approaching end → final minute → overtime → critical/blinking) that the rest of the app's 4-color palette doesn't provide. This is the one deliberate, contrast-verified (9.85:1 against `#0F1115`) exception to "one accent color," scoped narrowly to `lib/display-engine/colors.ts` — no shared design token was touched.

### Session Timer mode — known simplification

The existing data model tracks *per-item* `startedAt` (`SessionProgress.startedAt`), not a separate "whole session start time." Session Timer mode therefore reuses the same elapsed-time math as Count-up mode, differentiated by label/framing only ("session elapsed" vs "elapsed"), not by genuinely different timer semantics. A true session-wide timer would need a new field on `LiveState` — out of scope for this pass since it would touch the existing, frozen data model.

## Hold Mode

`HoldState` (`activateHold`/`deactivateHold`) is a full-screen takeover (`HoldScreen`), independent of the timer, with five presets (`HOLD_PRESETS`) and an optional `continueClock` flag. Rendered above `BroadcastOverlay`'s banners (z-40 vs z-30) but below emergency broadcasts (z-50) — an active emergency is meant to interrupt even a Hold screen.

## Broadcast Center

`BroadcastMessage`/`BroadcastDraft` cover title/message/icon/priority/target/expiration/duration/acknowledgement/persistence, plus scheduling (below). Targeting (`targetMatchesDisplay()`) supports all/type/specific-display/group. Each display renders broadcasts itself via `<BroadcastOverlay>` — non-emergency messages stack as up-to-3 bottom banners (dismissible unless `persistent`), emergency messages take over the full screen and can require acknowledgement.

**Banners are rendered on an opaque `bg-card/95` + blur surface, not a translucent tint** — an earlier version used `bg-status-*/15`, which let page content (e.g. the Presenter Display's own footer) bleed through and visually collide with banner text in Program/Session mode. Caught during end-to-end browser testing; fixed by giving the banner container a solid backdrop and moving the type's accent color to just the icon chip.

### Scheduled broadcasts — known limitation

`scheduleBroadcast(draft, scheduledFor)` stores a broadcast with a future `scheduledFor` timestamp. A lightweight in-store scheduler (`ensureSchedulerRunning()`, polling every 5s) promotes due broadcasts to `active` — but it runs inside whichever browser tab happens to have the Display Engine loaded, not on a server. **There is no server-side cron in this environment.** A scheduled broadcast only fires once some open tab (a display, the Broadcast Center, etc.) notices it's due. For a fully server-guaranteed schedule, this would need to move into the optional WS relay or a real backend job — out of scope here.

Recurrence (from the original spec's "schedule/recurrence") was **not implemented** — only one-shot future sends. A recurring broadcast would need its own rule model (RRULE-style) and is a reasonable follow-up, not attempted here to avoid scope creep on an already-large subsystem.

## Display Registry, Manager, and Profiles

Every display page calls `useRegisterDisplay(name, type, room, onCommand)` once: registers itself, heartbeats every 15s with a latency sample, and applies+clears any `pendingCommand` the Display Manager issues (`test-message`, `force-fullscreen`, `reload`). A display is considered `offline` after 45s without a heartbeat (`OFFLINE_AFTER_MS`).

**Display Manager** (`/display-manager`, PIN-gated) lists every registered display with live status/latency, inline rename/type/room/profile assignment, and per-display actions:
- **Preview** — a real, live `<iframe>` of the display's actual route (same synced state, genuinely live).
- **Screenshot** — uses the browser's native `getDisplayMedia()` picker (the operator selects the window/screen to capture) and downloads a PNG. This is the honest capability boundary: a *silent, remote* pixel-capture of another device's screen isn't achievable from a pure client-side multi-tab app without a server-side headless-browser service, which is out of scope here.
- **Force Fullscreen / Test Message / Reload** — delivered via `sendCommand()` → the target's `pendingCommand`, verified end-to-end in browser testing (Display Manager → shared state → target tab receives, applies, and clears the command).

**Display Profiles** (`profile-editor.tsx`, embedded in Display Manager) are full CRUD on top of `BUILT_IN_PROFILES` — built-in profiles (Presenter/Minimal/AV/Lobby/Green Room/Volunteer) are read-only; operators can create/edit/delete their own, then assign them to a display from the same list.

## Speaker Ready — new, narrowly-scoped state

The Green Room Display's "speaker ready" indicator has no equivalent in the existing `Program`/`LiveState` model — it's genuinely new information (has the next speaker checked in?), not derivable from anything already tracked. Added as a minimal `speakerReady: Record<programId, boolean>` map on `DisplayEngineState` with a single `setSpeakerReady()` action, rather than bolting it onto the frozen `Program` type.

## Volunteer Display — pragmatic scoping

The spec's "current/next assignment" implies per-volunteer task assignment, which doesn't exist anywhere in the cue-sheet data model (`Program` has no volunteer-roster concept). Rather than invent a parallel scheduling subsystem, the Volunteer Display reuses the *already-collected* `Program.team` field ("AV Team", "Sabha Team", "Kirtan Team", etc.) to show which team is responsible for the current/next/upcoming items — genuinely useful, built entirely from real data, without fabricating a feature the data can't support.

## Lobby Display — pragmatic scoping

"Sponsor Slides" and "Directional Information" are scoped down to a static text section rather than a full slide/asset-management CMS, which would be a project of its own. "Countdown to Next Event" and "Daily Schedule" are real and live.

### `scheduledStart` is a display string, not a timestamp — a real bug found and fixed

`Program.scheduledStart` (from the cue sheet) is a pre-formatted string like `"5:00 PM"` — the existing app has only ever rendered it as plain text (`components/operator/program-list.tsx`). Three places in this subsystem initially called `new Date(scheduledStart)` / `Date.parse(scheduledStart)` on it, which is not a parseable format and silently produced `Invalid Date` (`session-timeline.tsx`, the Green Room "expected start" label, and the Lobby countdown). Caught during end-to-end browser testing. Fixed by:
- Rendering the field as plain text everywhere except the one place a real countdown is required.
- Adding a narrow `parseTimeToday()` helper (Lobby page only) that parses the actual `"H:MM AM/PM"` format against *today's* date — a safe assumption for a display that only ever runs on the actual event day, same assumption the rest of the live-event tooling already makes.

## A second real bug found in testing: stale `clientId` race

`useDisplayEngine()`'s `clientId` was a module-level variable only corrected (from the SSR `"server"` fallback to the real per-tab id) inside `ensureTransportConnected()`, which runs post-commit via `useSyncExternalStore`'s `subscribe()`. A fast-firing effect (`useRegisterDisplay`'s registration effect) could run before that correction landed, registering a bogus `"server"` entry in the shared display registry. Fixed by resolving `clientId` eagerly at module init (`typeof window !== "undefined" ? readClientId() : "server"`) instead of waiting for `subscribe()` — verified fixed by clearing state and re-registering, confirming exactly one clean entry.

## Keyboard shortcuts (Presenter Display)

`Space` pause/resume · `+`/`-` adjust 30s · `R` reset · `F` fullscreen toggle · `H` hold toggle · `Esc` exit fullscreen. Scoped per-page via `useKeyboardShortcuts()`, ignored while an `<input>`/`<textarea>` has focus, never attached globally.

## Session persistence & reconnection

All engine state lives in `localStorage` (`kramflow.display-engine.v1`) and rehydrates on load; `useRegisterDisplay` re-registers and resyncs the clock on every mount, so a refreshed display picks up exactly where the shared state left off (current mode, hold state, active broadcasts, timer). `useFullscreen()` remembers the fullscreen preference across reloads (browsers only allow *entering* fullscreen from a real user gesture, so a refreshed display can't silently re-enter it, but the preference is available for an operator to act on).

## Known constraints

- **Framer Motion over `styled-jsx`** — `AGENTS.md` warns this Next.js version has unverified/changed APIs; the TimerRing's blink and the HoldScreen's fade both use Framer Motion (already a project dependency) rather than risk `styled-jsx`. One early draft of the Broadcast Center did use `<style jsx global>` for form-input styling — caught in review and replaced with plain Tailwind classes before merge.
- **No new runtime dependencies** — the WS relay is hand-rolled specifically to avoid adding `ws` to `package.json` for what is optional, non-production-required infrastructure.
