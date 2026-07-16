# Deployment

## Platform

KramFlow deploys to [Vercel](https://vercel.com) with zero special configuration — it's a standard Next.js App Router project. Connect the GitHub repository and Vercel auto-detects the framework, build command (`npm run build`), and output.

## Before every deploy

Run locally and confirm all three pass:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Reference data (`sessions`/`programs`) is no longer a build artifact — it lives in Supabase and is populated via `npm run seed` (once, against a fresh project) or at runtime via Excel upload / the item form. There is no `predev`/`prebuild` data-generation step anymore; `npm run build` just builds the app.

## Supabase setup (required)

1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase/schema.sql` once in the project's SQL Editor — creates `sessions`, `programs`, `live_state`, `activity_log`, their RLS policies, and adds them to the Realtime publication.
3. Run `npm run seed` locally (with the env vars below set in `.env.local`) to load the bundled `data/cue-sheet.xlsx` — or skip this and upload a cue sheet from `/operator/cue-sheet` after first deploy.

## Environment variables

Set in the Vercel project's **Settings → Environment Variables** (and locally in `.env.local`, gitignored — see `.env.example`):

| Variable | Required | Notes |
|---|---|---|
| `OPERATOR_PIN` | Recommended | 4-digit PIN gating `/operator` and `/remote`. Falls back to `0065` if unset — fine for a private preview deploy, **not** fine for a production URL anyone could stumble onto. Set a real value for Production and Preview environments. |
| `NEXT_PUBLIC_SUPABASE_URL` | Required | Supabase project URL. Safe to expose to the client. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Required | Supabase anon public key. Safe to expose — Row Level Security restricts it to read-only on public tables (see `supabase/schema.sql`). |
| `SUPABASE_SERVICE_ROLE_KEY` | Required | Server-only. Used by every API route that writes data. Bypasses RLS — never expose to the client, never prefix with `NEXT_PUBLIC_`. |
| `AUTH_COOKIE_SECRET` | Recommended | Signs the operator session cookie (`app/api/auth/route.ts`). Falls back to a dev-only default if unset — set a real random value for production. |

`@supabase/ssr` and `@supabase/supabase-js` are both in active use now (client + server Supabase clients, `lib/supabase/*`) — no longer "pre-staged but unused."

## What "production-ready" means here — and what it doesn't

The build is clean, routes are correctly split between static (TV/Display Engine displays, the launcher) and dynamic (auth, live-state mutations, the programs/sessions/upload API), and the core flows have been verified via `tsc`/`lint`/`build`. Two things to go in with eyes open about:

1. **Live end-to-end verification against a real Supabase project is still pending** as of this restructure — the code path is exercised by static analysis and a clean build, but hasn't yet been run against actual Supabase credentials (seed → cross-device sync → upload → form CRUD). Do this before a real event: `npm run seed`, then open `/operator` and `/green-room` on two separate devices and confirm a Next/Hold/Alert on one reaches the other within ~1s.
2. **PIN auth is a convenience gate, not real authentication.** See `docs/DEPLOYMENT.md#hardening-authentication` below. It's stronger than before this restructure (a signed `httpOnly` cookie now gates every write API route server-side, not just a client-readable flag), but still one shared PIN for the whole crew.

## Hardening authentication

The PIN check (`app/api/auth/route.ts`) now sets a signed `httpOnly` session cookie (`lib/server/auth-cookie.ts`) that every mutating API route verifies (`lib/server/require-auth.ts`) — a real server-side enforcement point that didn't exist before this restructure. It's still: one shared PIN, no rate limiting, no lockout, no hashing (though the PIN itself never reaches the client bundle, and the cookie is HMAC-signed, not just an opaque flag).

For a deployment where more matters, replace it with:

- Per-user credentials (even a simple allowlist of names + passwords) instead of one shared PIN
- Rate limiting / lockout on repeated failed attempts (`app/api/auth/route.ts` is the single choke point to add this)
- A durable audit log beyond the operator activity feed (`activity_log`, currently last-20 / not persisted long-term by any retention policy)
- Consider a proper identity provider (e.g., Supabase Auth, or Auth.js) if the crew list grows past "everyone shares one PIN"

## Rollback

Vercel keeps every deployment; use **Deployments → [previous deploy] → Promote to Production** to roll back the app instantly. Data rollback is separate — Supabase's point-in-time recovery (paid tiers) or your own backup/export of the `sessions`/`programs` tables, since app rollback doesn't touch the database.

## Custom domain

Standard Vercel domain setup — add the domain in **Settings → Domains**, point DNS per Vercel's instructions. No app-level changes needed.
