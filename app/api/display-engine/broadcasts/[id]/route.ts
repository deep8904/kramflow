import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/require-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

// DELETE cancels a not-yet-sent scheduled broadcast (removes it entirely
// — it never actually went out, so it shouldn't appear in history either,
// matching the original store's cancelScheduled). requireAuth()-gated —
// only Broadcast Center cancels a scheduled send.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const supabase = supabaseAdmin();
  const { error } = await supabase.from("display_broadcasts").delete().eq("id", id).eq("status", "scheduled");
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
