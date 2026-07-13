# Deployment

## Platform

KramFlow deploys to [Vercel](https://vercel.com) with zero special configuration — it's a standard Next.js App Router project. Connect the GitHub repository and Vercel auto-detects the framework, build command (`npm run build`), and output.

## Before every deploy

Run locally and confirm all four pass:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

`npm run build` automatically runs `scripts/build-cuesheet.mjs` first (via the `prebuild` hook), regenerating `lib/generated/cuesheet.json` from `data/cue-sheet.xlsx`. Vercel's build step does the same — there is no manual data-prep step to remember.

## Environment variables

Set in the Vercel project's **Settings → Environment Variables**:

| Variable | Required | Notes |
|---|---|---|
| `OPERATOR_PIN` | Recommended | 4-digit PIN gating `/operator` and `/remote`. Falls back to `0065` if unset — fine for a private preview deploy, **not** fine for a production URL anyone could stumble onto. Set a real value for Production and Preview environments. |

No other environment variables are required. `@supabase/supabase-js` and `@supabase/ssr` are installed but unused — they're pre-staged for the Realtime sync work in the roadmap, not required for the current build.

## What "production-ready" means here — and what it doesn't

This app is genuinely deployable today: the build is clean, routes are correctly split between static (TV displays, launcher) and dynamic (the PIN check), and the four surfaces have been verified end-to-end. Two things to go in with eyes open about:

1. **Sync is same-browser only.** Live state syncs via `localStorage` + `BroadcastChannel`, which works across tabs/windows on one device but **not** across separate devices (a phone and a TV in the same room do not currently see each other's updates in real time — each independently reads its own local storage). This is fine for demoing on one machine; it is **not** sufficient for the actual multi-device, multi-room use case KramFlow is built for. Wiring Supabase Realtime (already planned, see `docs/ARCHITECTURE.md`) is the next required step before running a real multi-TV event on this.
2. **PIN auth is a convenience gate, not real authentication.** See `docs/DEPLOYMENT.md#hardening-authentication` below before treating `/operator`/`/remote` as genuinely access-controlled.

## Hardening authentication

The current PIN check (`app/api/auth/route.ts`) is intentionally minimal: one shared PIN, compared server-side, unlocking a `sessionStorage` flag. It stops a casual passerby from opening the operator dashboard; it does not stop a determined attacker (no rate limiting, no lockout, no hashing — though the PIN itself never reaches the client bundle).

For a deployment where that matters, replace it with:

- Per-user credentials (even a simple allowlist of names + passwords) instead of one shared PIN
- A signed, `httpOnly` session cookie set by the server instead of a client-readable `sessionStorage` flag
- Rate limiting / lockout on repeated failed attempts (`app/api/auth/route.ts` is the single choke point to add this)
- An audit log of who unlocked the control surfaces and when
- Consider a proper identity provider (e.g., Vercel's own auth integrations, or Auth.js) if the crew list grows past "everyone shares one PIN"

## Rollback

Vercel keeps every deployment; use **Deployments → [previous deploy] → Promote to Production** to roll back instantly if a release regresses.

## Custom domain

Standard Vercel domain setup — add the domain in **Settings → Domains**, point DNS per Vercel's instructions. No app-level changes needed.
