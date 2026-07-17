import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

// PATCH activate/deactivate Hold. No requireAuth() — Presenter's own Hold
// button is an unauthenticated control today (no PIN on /presenter); this
// migration changes how Hold syncs, not who can trigger it. See the
// restructure plan's "Auth boundary" note.
export async function PATCH(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const hold =
    body.active === true
      ? {
          active: true,
          message: typeof body.message === "string" ? body.message : "Please Stand By",
          subMessage: typeof body.subMessage === "string" ? body.subMessage : null,
          continueClock: body.continueClock === true,
          activatedAt: new Date().toISOString(),
        }
      : null;

  if (hold) {
    const { error } = await supabase.from("display_state").update({ hold }).eq("id", 1);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  } else {
    const { data: current, error: fetchError } = await supabase
      .from("display_state")
      .select("hold")
      .eq("id", 1)
      .single();
    if (fetchError) return NextResponse.json({ ok: false, error: fetchError.message }, { status: 500 });
    const { error } = await supabase
      .from("display_state")
      .update({ hold: { ...current.hold, active: false, activatedAt: null } })
      .eq("id", 1);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
