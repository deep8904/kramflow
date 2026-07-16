import "server-only";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifySessionToken } from "./auth-cookie";

// Every mutating API route (live-state actions, Phase 2's programs/upload
// routes) calls this first. Returns a 401 response to short-circuit the
// route on failure, or null when the caller is authorized.
export async function requireAuth(): Promise<NextResponse | null> {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
