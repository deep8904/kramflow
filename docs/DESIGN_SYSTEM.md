# Design System

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

`16px` on all cards and surfaces.

## Spacing scale

`8 / 16 / 24 / 32 / 48` — everything aligns to an 8px grid. Default gaps
between stacked sections are `24px`–`48px` depending on hierarchy weight.

## Typography scale

| Name | Size | Use |
|---|---|---|
| Hero | 64px | Live Now title |
| Title | 40px | Section titles, Next item |
| Subtitle | 24px | Presenter names, On Deck |
| Body | 18px | Status rows, notes |
| Caption | 14px | Progress footer, labels |

Font: system sans (SF Pro-equivalent) — `-apple-system`/Inter fallback stack,
tabular numerals for countdowns.

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
