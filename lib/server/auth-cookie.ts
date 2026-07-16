import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Signs/verifies the operator session cookie set by app/api/auth/route.ts.
// No per-user identity (matches the existing "convenience gate for a small
// trusted crew" model, see docs/DEPLOYMENT.md) — this just proves the
// holder passed the PIN check, server-verifiably, instead of the old
// client-readable sessionStorage flag having no server-side enforcement at
// all. See docs/DEPLOYMENT.md#hardening-authentication, which already
// prescribed exactly this change.

export const AUTH_COOKIE_NAME = "kramflow_session";

const SECRET = process.env.AUTH_COOKIE_SECRET ?? "kramflow-dev-only-secret-do-not-use-in-production";

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("hex");
}

export function createSessionToken(): string {
  const issuedAt = Date.now().toString();
  return `${issuedAt}.${sign(issuedAt)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) return false;
  const expected = sign(issuedAt);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
