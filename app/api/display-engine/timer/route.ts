import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

interface TimerState {
  mode: string;
  source: "auto" | "manual";
  startedAt: string | null;
  durationSeconds: number;
  pausedAt: string | null;
  adjustmentSeconds: number;
  thresholds: { yellowAt: number; orangeAt: number; redAt: number; criticalAfter: number };
}

// PATCH every timer action (mode/source/start/pause/resume/reset/adjust/
// thresholds), mirroring app/api/live/route.ts's single-endpoint,
// action-dispatch shape. No requireAuth() — these are Presenter's own
// unauthenticated controls today; see the restructure plan's "Auth
// boundary" note.
export async function PATCH(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const action = body.action;
  if (typeof action !== "string") {
    return NextResponse.json({ ok: false, error: "Missing action" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: row, error: fetchError } = await supabase.from("display_state").select("timer").eq("id", 1).single();
  if (fetchError) return NextResponse.json({ ok: false, error: fetchError.message }, { status: 500 });
  const timer = row.timer as TimerState;

  let next: TimerState;
  switch (action) {
    case "setMode":
      next = { ...timer, mode: String(body.mode) };
      break;
    case "setSource":
      next = { ...timer, source: body.source === "manual" ? "manual" : "auto" };
      break;
    case "start":
      next = {
        ...timer,
        source: "manual",
        durationSeconds: Number(body.durationSeconds),
        adjustmentSeconds: 0,
        startedAt: new Date().toISOString(),
        pausedAt: null,
      };
      break;
    case "pause":
      if (timer.pausedAt) return NextResponse.json({ ok: true, noop: true });
      next = { ...timer, pausedAt: new Date().toISOString() };
      break;
    case "resume": {
      if (!timer.pausedAt || !timer.startedAt) {
        next = { ...timer, pausedAt: null };
        break;
      }
      const pausedMs = Date.now() - Date.parse(timer.pausedAt);
      next = { ...timer, startedAt: new Date(Date.parse(timer.startedAt) + pausedMs).toISOString(), pausedAt: null };
      break;
    }
    case "reset":
      next = { ...timer, startedAt: null, pausedAt: null, adjustmentSeconds: 0 };
      break;
    case "adjust":
      next = { ...timer, adjustmentSeconds: timer.adjustmentSeconds + Number(body.deltaSeconds) };
      break;
    case "setThresholds":
      next = { ...timer, thresholds: body.thresholds as TimerState["thresholds"] };
      break;
    default:
      return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  }

  const { error } = await supabase.from("display_state").update({ timer: next }).eq("id", 1);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
