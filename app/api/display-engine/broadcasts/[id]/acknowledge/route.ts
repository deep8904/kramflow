import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

// POST acknowledge (emergency broadcasts). No requireAuth() —
// broadcast-overlay.tsx's "Acknowledge" button is on the public,
// unauthenticated emergency takeover screen.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const displayId = body.displayId;
  if (typeof displayId !== "string") {
    return NextResponse.json({ ok: false, error: "displayId is required" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: row, error: fetchError } = await supabase
    .from("display_broadcasts")
    .select("acknowledged_by")
    .eq("id", id)
    .single();
  if (fetchError) return NextResponse.json({ ok: false, error: fetchError.message }, { status: 500 });

  const acknowledgedBy = row.acknowledged_by as string[];
  if (acknowledgedBy.includes(displayId)) return NextResponse.json({ ok: true, noop: true });

  const { error } = await supabase
    .from("display_broadcasts")
    .update({ acknowledged_by: [...acknowledgedBy, displayId] })
    .eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
