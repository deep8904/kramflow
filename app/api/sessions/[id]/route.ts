import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/require-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { sheet_name, event_name, day_label, session_label, sort_order } = body;
  const patch: Record<string, unknown> = {};
  if (typeof sheet_name === "string") patch.sheet_name = sheet_name;
  if (typeof event_name === "string") patch.event_name = event_name;
  if (typeof day_label === "string" && day_label) patch.day_label = day_label;
  if (typeof session_label === "string" && session_label) patch.session_label = session_label;
  if (typeof sort_order === "number") patch.sort_order = sort_order;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: false, error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase.from("sessions").update(patch).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  const { id } = await params;

  const supabase = supabaseAdmin();
  // programs.session_id has ON DELETE CASCADE (see supabase/schema.sql), so
  // deleting the session also removes every item in it.
  const { error } = await supabase.from("sessions").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const { data: liveState } = await supabase.from("live_state").select("active_session_id").eq("id", 1).single();
  if (liveState?.active_session_id === id) {
    await supabase.from("live_state").update({ active_session_id: null }).eq("id", 1);
  }

  return NextResponse.json({ ok: true });
}
