import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/require-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { programInputSchema, toProgramRow } from "@/lib/validation/program";

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("sessionId");
  const supabase = supabaseAdmin();
  let query = supabase.from("programs").select("*").order("sort_order", { ascending: true });
  if (sessionId) query = query.eq("session_id", sessionId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, programs: data });
}

export async function POST(request: Request) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = programInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  let sortOrder = parsed.data.sortOrder;
  if (sortOrder === undefined) {
    const { data: maxRow } = await supabase
      .from("programs")
      .select("sort_order")
      .eq("session_id", parsed.data.sessionId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    sortOrder = (maxRow?.sort_order ?? 0) + 1;
  }

  const { data, error } = await supabase
    .from("programs")
    .insert(toProgramRow({ ...parsed.data, sortOrder }))
    .select()
    .single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, program: data });
}
