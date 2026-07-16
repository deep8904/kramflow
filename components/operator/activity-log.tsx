"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { SectionLabel } from "@/components/tv/section-label";

// Short reverse-chronological list of the last ~20 operator actions — not
// analytics, just enough that a mid-show stage-manager handoff doesn't lose
// context. Backed by the activity_log table, appended to server-side by
// app/api/live/route.ts on every successful action.

interface ActivityRow {
  id: number;
  action: string;
  detail: string | null;
  created_at: string;
}

const LIMIT = 20;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function ActivityLog() {
  const [rows, setRows] = useState<ActivityRow[]>([]);

  useEffect(() => {
    const client = supabaseBrowser();

    async function load() {
      const { data } = await client
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(LIMIT);
      if (data) setRows(data as ActivityRow[]);
    }
    load();

    const channel = client
      .channel("activity-log-panel")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_log" }, (payload) => {
        setRows((prev) => [payload.new as ActivityRow, ...prev].slice(0, LIMIT));
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  if (rows.length === 0) return null;

  return (
    <div>
      <SectionLabel>Activity</SectionLabel>
      <ul className="mt-3 flex flex-col gap-1.5 max-h-48 overflow-y-auto">
        {rows.map((row) => (
          <li key={row.id} className="flex items-baseline gap-2 text-caption">
            <span className="text-muted-2 tabular-nums shrink-0">{formatTime(row.created_at)}</span>
            <span className="text-muted truncate">{row.detail ?? row.action}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
