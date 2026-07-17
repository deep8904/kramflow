import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

// POST register-or-heartbeat, upsert by id. No requireAuth() — called
// automatically every 15s by every public display page
// (lib/display-engine/use-register-display.ts), which are themselves
// unauthenticated routes today. Preserves the original store's merge
// behavior: registering an already-known id keeps its registeredAt and
// only overwrites name/type/room if the caller actually supplied them
// (a bare heartbeat call only sends id + latencyMs).
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const id = body.id;
  if (typeof id !== "string" || !id) {
    return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });
  }

  // use-time-sync.ts's latencyMs is roundTripMs/2 — often a non-integer
  // (e.g. 22.5) — but latency_ms is an `integer` column, which Postgres
  // rejects a fractional value for. Round it; sub-millisecond precision
  // isn't meaningful here anyway.
  const latencyMs = typeof body.latencyMs === "number" ? Math.round(body.latencyMs) : null;

  const supabase = supabaseAdmin();
  const { data: existing } = await supabase.from("display_registry").select("*").eq("id", id).maybeSingle();

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { last_seen_at: now };
  if (typeof body.latencyMs === "number" || body.latencyMs === null) patch.latency_ms = latencyMs;
  if (typeof body.name === "string") patch.name = body.name;
  if (typeof body.type === "string") patch.type = body.type;
  if (body.room !== undefined) patch.room = body.room;

  if (existing) {
    const { error } = await supabase.from("display_registry").update(patch).eq("id", id);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase.from("display_registry").insert({
      id,
      name: typeof body.name === "string" ? body.name : id,
      type: typeof body.type === "string" ? body.type : "custom",
      room: body.room ?? null,
      registered_at: now,
      last_seen_at: now,
      latency_ms: latencyMs,
    });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
