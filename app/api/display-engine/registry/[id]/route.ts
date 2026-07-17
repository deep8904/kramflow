import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/require-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

// requireAuth()-gated — only Display Manager (PIN-gated) renames/
// reassigns/commands/removes a display. Registering and heartbeating
// (POST ../route.ts) stay public since public display pages do that
// themselves.
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

  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string") patch.name = body.name;
  if (typeof body.type === "string") patch.type = body.type;
  if (body.room !== undefined) patch.room = body.room;
  if (body.profileId !== undefined) patch.profile_id = body.profileId;
  if (body.pendingCommand !== undefined) patch.pending_command = body.pendingCommand;

  const supabase = supabaseAdmin();
  const { error } = await supabase.from("display_registry").update(patch).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const supabase = supabaseAdmin();
  const { error } = await supabase.from("display_registry").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
