# Design System

## Four experiences, not one responsive page

StageFlow is four purpose-built surfaces (`docs/IA.md`), each with its own
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
| `green` | `#22C55E` | Ready / go / live |
| `blue` | `#3B82F6` | Informational / next |
| `orange` | `#F59E0B` | Warning / prepare |
| `red` | `#EF4444` | Alert / not ready |

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
