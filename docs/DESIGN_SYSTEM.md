# Design System

## Four experiences, not one responsive page

KramFlow is four purpose-built surfaces (`docs/IA.md`), each with its own
layout logic:

- **TV** (Green Room, AV) — full-bleed, hero typography, zero controls.
- **Operator Dashboard** — dense, full-width, three-column control room.
- **Operator Remote** — one-handed, thumb-zone controls, huge primary button.

Never solve "does it work on mobile" by shrinking the desktop layout, and
never solve "does it work on a TV" by centering the desktop layout in a
`max-width` box. Each breakpoint gets its own layout decision.

## Principles

- Minimal
- Large typography
- Whitespace
- One action per screen
- No tables
- No charts
- No analytics
- No tiny text
- Only one accent color per status
- Cards should breathe
- Everything aligns to an 8px grid

## Inspiration (combine, do not copy)

| Layer | References |
|---|---|
| Typography | Apple TV, Apple Calendar, Apple Keynote Presenter View |
| Layout | Linear, Notion Calendar, Raycast |
| Status system | Formula 1 Race Control, airport departure boards |
| Motion | Apple Human Interface Guidelines, Framer Motion |
| Spacing | Vercel Dashboard, Linear |

## Color palette

No gradients. No glassmorphism. No neumorphism. Maximum 3 colors visible
simultaneously (background + card + one accent).

| Token | Value | Use |
|---|---|---|
| `background` | `#0F1115` | App background |
| `card` | `#171A21` | Card surfaces |
| `primary` | `#FFFFFF` | Primary text |
| `muted` | `#9CA3AF` | Secondary text, labels |
| `muted-2` | `#828A9C` | Tertiary text — captions, timestamps, dividing labels |
| `green` | `#22C55E` | Ready / go / live |
| `blue` | `#3B82F6` | Informational / next |
| `orange` | `#F59E0B` | Warning / prepare |
| `red` | `#EF4444` | Alert / not ready |

Every text color is checked against both `background` and `card` for WCAG AA
(4.5:1 for body text). `muted-2` was originally `#6B7280` (3.91:1 — failed);
if you ever adjust these tokens, re-verify contrast rather than eyeballing
it — see the script in this repo's history (`git log -S muted-2`) for the
exact method.

## Border radius

`20px` on cards and surfaces, `12px` on inputs/small controls.

## Spacing scale

`8 / 16 / 24 / 32 / 48 / 64 / 80` — everything aligns to an 8px grid. TV
surfaces use the top of this range (`64px`–`80px` between stacked sections);
the denser operator dashboard uses the middle (`24px`–`40px`).

## TV safe area

A **fixed** margin, not a proportion of the screen: `clamp(48px, 4vw, 64px)`
on every edge (`.tv-safe-area`). TV surfaces are full-bleed otherwise — no
centered `max-width` container. The safe area is the only inset.

## Responsive breakpoints (Operator Dashboard)

The desktop dashboard stacks into a single scrollable column below `xl`
(1280px) — including the header, which goes from a single row to a stacked
layout. `ProgramList` rows independently switch from a two-line stacked
layout to a single-line row at `sm` (640px), regardless of the page-level
breakpoint.

The three-column grid uses **narrower** fixed column widths at `xl`
(`340px`/`280px`) than at `2xl` (`400px`/`320px`, 1536px+). This was a real
bug, not a preference: at exactly `lg` (1024px) with the original fixed
400px/320px columns, the remaining space for the program list dropped to
~280px — not enough for the single-line row layout, causing titles to
truncate to almost nothing. If you widen these columns again, re-check the
1024–1439px range specifically, not just 1920px.

`/remote` doesn't have this problem — it's a single column at every width by
design — but was verified down to 320px regardless (no horizontal overflow,
every control reachable).

## Typography scale

Sized for the surface, not one scale stretched across four devices.

| Name | Size | Use |
|---|---|---|
| Hero | 84px | Live Now title (TV), the countdown number (Remote) |
| Title | 36px | Section titles, current-item title (Operator/Remote) |
| Subtitle | 28px | Program titles, Next item, presenter names |
| Body | 20px | Secondary text — notes, requirement values, list rows |
| Caption | 15px | Eyebrow labels only (`LIVE NOW`, footer) — never body copy |

Font: system sans (SF Pro-equivalent) — `-apple-system`/Inter fallback stack,
tabular numerals for countdowns and item counts.

## Motion

- Fade, slide, opacity only.
- Duration: `250ms`.
- Easing: standard ease-out, no bounce, no spring overshoot.
- Motion communicates state change (item advanced, alert appeared) — never
  decoration.

## Rules

- One accent color per status badge, never combined.
- No unnecessary icons — an icon only appears when it replaces a word, never
  alongside one.
- No borders as decoration — separation comes from spacing and card surfaces.

## Accessibility

- Every custom interactive element carries a `focus-visible` ring:
  `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40
  focus-visible:ring-offset-2 focus-visible:ring-offset-background` (inputs
  use `/30` instead of `/40`). Copy this pattern for new components.
- Anything clickable is a real `<button>`, not a `<div onClick>` —
  `ProgramList` rows were the one place this had drifted; fixed, see
  `docs/CHANGELOG.md`.
- Icon-only controls get an `aria-label`; toggle-style controls (severity
  pills, quick-action panels, session tabs) get `aria-pressed` or
  `aria-current`.
- All text colors are checked against WCAG AA — see the note under Color
  palette above.
- Alert banners carry `role="alert"`.
