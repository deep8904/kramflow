import { NextResponse } from "next/server";

// Server-only: OPERATOR_PIN (no NEXT_PUBLIC_ prefix) never reaches the
// client bundle. Falls back to the documented default so the app works
// out of the box; production deployments should set a real value.
// See docs/DEPLOYMENT.md — this is a convenience gate, not real auth.
const OPERATOR_PIN = process.env.OPERATOR_PIN ?? "0065";

export async function POST(request: Request) {
  let pin: unknown;
  try {
    ({ pin } = await request.json());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (typeof pin !== "string" || pin !== OPERATOR_PIN) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
