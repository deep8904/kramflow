import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/require-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase.from("sessions").select("*").order("sort_order", { ascending: true });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, sessions: data });
}

export async function POST(request: Request) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { id, sheet_name, event_name, day_label, session_label, sort_order } = body;
  if (typeof id !== "string" || !id || typeof day_label !== "string" || typeof session_label !== "string") {
    return NextResponse.json({ ok: false, error: "id, day_label, and session_label are required" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase.from("sessions").insert({
    id,
    sheet_name: typeof sheet_name === "string" ? sheet_name : day_label,
    event_name: typeof event_name === "string" ? event_name : "",
    day_label,
    session_label,
    sort_order: typeof sort_order === "number" ? sort_order : 0,
  });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
