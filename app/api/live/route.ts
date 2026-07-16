import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/require-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Alert } from "@/lib/types";

// Single PATCH endpoint for every live-state mutation (start/next/previous/
// jumpTo/finish/togglePause/setAlert/dismissAlert/setNotes/selectSession/
// reset). One endpoint rather than one route per action because they all
// share the same "read live_state, compute next state, write it back,
// append an activity_log row" shape — see lib/store.tsx for the client
// side of this, which subscribes to Realtime rather than reading this
// route's response body directly.

interface LiveStateRow {
  active_session_id: string | null;
  paused_at: string | null;
  alert: Alert | null;
  progress_by_session: Record<string, { currentOrder: number | null; startedAt: string | null }>;
  notes_overrides: Record<string, string>;
}

async function logActivity(action: string, detail: string) {
  const supabase = supabaseAdmin();
  const { error } = await supabase.from("activity_log").insert({ action, detail });
  if (error) console.error("[api/live] activity_log insert failed:", error);
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

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
  const { data: row, error: fetchError } = await supabase.from("live_state").select("*").eq("id", 1).single();
  if (fetchError) {
    return NextResponse.json({ ok: false, error: fetchError.message }, { status: 500 });
  }
  const current = row as LiveStateRow;

  const activeProgress = () =>
    current.progress_by_session[current.active_session_id ?? ""] ?? { currentOrder: null, startedAt: null };

  let patch: Partial<LiveStateRow> = {};
  let detail = "";

  switch (action) {
    case "selectSession": {
      const sessionId = body.sessionId;
      if (typeof sessionId !== "string") return NextResponse.json({ ok: false }, { status: 400 });
      patch = { active_session_id: sessionId, paused_at: null };
      detail = `Switched session`;
      break;
    }
    case "start": {
      patch = {
        progress_by_session: {
          ...current.progress_by_session,
          [current.active_session_id ?? ""]: { currentOrder: 1, startedAt: new Date().toISOString() },
        },
        paused_at: null,
      };
      detail = "Started";
      break;
    }
    case "next": {
      const maxOrder = body.maxOrder;
      if (typeof maxOrder !== "number") return NextResponse.json({ ok: false }, { status: 400 });
      const { currentOrder } = activeProgress();
      if (currentOrder === null || currentOrder >= maxOrder) {
        return NextResponse.json({ ok: true, noop: true });
      }
      patch = {
        progress_by_session: {
          ...current.progress_by_session,
          [current.active_session_id ?? ""]: { currentOrder: currentOrder + 1, startedAt: new Date().toISOString() },
        },
        paused_at: null,
      };
      detail = `Advanced to item ${currentOrder + 1}`;
      break;
    }
    case "previous": {
      const minOrder = body.minOrder;
      if (typeof minOrder !== "number") return NextResponse.json({ ok: false }, { status: 400 });
      const { currentOrder } = activeProgress();
      if (currentOrder === null || currentOrder <= minOrder) {
        return NextResponse.json({ ok: true, noop: true });
      }
      patch = {
        progress_by_session: {
          ...current.progress_by_session,
          [current.active_session_id ?? ""]: { currentOrder: currentOrder - 1, startedAt: new Date().toISOString() },
        },
        paused_at: null,
      };
      detail = `Went back to item ${currentOrder - 1}`;
      break;
    }
    case "jumpTo": {
      const order = body.order;
      if (typeof order !== "number") return NextResponse.json({ ok: false }, { status: 400 });
      patch = {
        progress_by_session: {
          ...current.progress_by_session,
          [current.active_session_id ?? ""]: { currentOrder: order, startedAt: new Date().toISOString() },
        },
        paused_at: null,
      };
      detail = `Jumped to item ${order}`;
      break;
    }
    case "finish": {
      const maxOrder = body.maxOrder;
      if (typeof maxOrder !== "number") return NextResponse.json({ ok: false }, { status: 400 });
      patch = {
        progress_by_session: {
          ...current.progress_by_session,
          [current.active_session_id ?? ""]: { currentOrder: maxOrder + 1, startedAt: null },
        },
        paused_at: null,
      };
      detail = "Finished session";
      break;
    }
    case "togglePause": {
      if (current.paused_at) {
        const pausedMs = Date.now() - Date.parse(current.paused_at);
        const progress = activeProgress();
        const shiftedStartedAt = progress.startedAt
          ? new Date(Date.parse(progress.startedAt) + pausedMs).toISOString()
          : null;
        patch = {
          progress_by_session: {
            ...current.progress_by_session,
            [current.active_session_id ?? ""]: { ...progress, startedAt: shiftedStartedAt },
          },
          paused_at: null,
        };
        detail = "Resumed";
      } else {
        patch = { paused_at: new Date().toISOString() };
        detail = "Hold started";
      }
      break;
    }
    case "setAlert": {
      const alert = body.alert as Alert | undefined;
      if (!alert || typeof alert.message !== "string") return NextResponse.json({ ok: false }, { status: 400 });
      patch = { alert };
      detail = `Alert: ${alert.message}`;
      break;
    }
    case "dismissAlert": {
      patch = { alert: null };
      detail = "Alert dismissed";
      break;
    }
    case "setNotes": {
      const programId = body.programId;
      const notes = body.notes;
      if (typeof programId !== "string" || typeof notes !== "string") {
        return NextResponse.json({ ok: false }, { status: 400 });
      }
      patch = { notes_overrides: { ...current.notes_overrides, [programId]: notes } };
      detail = "Notes updated";
      break;
    }
    case "reset": {
      patch = {
        active_session_id: current.active_session_id,
        progress_by_session: {},
        paused_at: null,
        alert: null,
        notes_overrides: {},
      };
      detail = "Reset";
      break;
    }
    default:
      return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  }

  const { error: updateError } = await supabase.from("live_state").update(patch).eq("id", 1);
  if (updateError) {
    return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
  }

  await logActivity(action, detail);
  return NextResponse.json({ ok: true });
}
