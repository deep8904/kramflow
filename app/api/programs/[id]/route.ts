import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/require-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { programUpdateSchema, toProgramRow } from "@/lib/validation/program";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = programUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("programs")
    .update({ ...toProgramRow(parsed.data), updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, program: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const supabase = supabaseAdmin();
  const { error } = await supabase.from("programs").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
