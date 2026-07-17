import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/require-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

// POST send-now or schedule a broadcast. requireAuth()-gated — only
// Broadcast Center + Operator's embedded quick-panel create broadcasts
// (both PIN-gated). Dismiss/acknowledge/promote stay public (see their
// own route files) since BroadcastOverlay — rendered on every public
// display — calls dismiss/acknowledge directly.
export async function POST(request: Request) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const draft = body.draft as Record<string, unknown> | undefined;
  if (!draft || typeof draft.title !== "string") {
    return NextResponse.json({ ok: false, error: "draft.title is required" }, { status: 400 });
  }

  const scheduledFor = typeof body.scheduledFor === "string" ? body.scheduledFor : null;
  const now = new Date();
  const expiresInMinutes = typeof draft.expiresInMinutes === "number" ? draft.expiresInMinutes : null;
  const baseTime = scheduledFor ? Date.parse(scheduledFor) : now.getTime();

  const row = {
    type: draft.type,
    title: draft.title,
    message: draft.message,
    icon: draft.icon ?? null,
    priority: draft.priority,
    target: draft.target,
    created_at: now.toISOString(),
    expires_at: expiresInMinutes ? new Date(baseTime + expiresInMinutes * 60000).toISOString() : null,
    duration_seconds: draft.durationSeconds ?? null,
    acknowledgement_required: draft.acknowledgementRequired === true,
    persistent: draft.persistent === true,
    acknowledged_by: [],
    scheduled_for: scheduledFor,
    status: scheduledFor ? "scheduled" : "sent",
  };

  const supabase = supabaseAdmin();
  const { data, error } = await supabase.from("display_broadcasts").insert(row).select().single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, broadcast: data });
}
