"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

interface ActivityRow {
  id: number;
  action: string;
  detail: string | null;
  created_at: string;
}

const LIMIT = 20;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
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
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_log" },
        (payload) => {
          setRows((prev) =>
            [payload.new as ActivityRow, ...prev].slice(0, LIMIT)
          );
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  if (rows.length === 0) return null;

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.14em] text-tertiary font-medium mb-3">
        Activity
      </p>
      <ul className="flex flex-col gap-0 max-h-44 overflow-y-auto">
        {rows.map((row, i) => (
          <li
            key={row.id}
            className="flex items-baseline gap-3 py-1.5 border-b border-[var(--color-border)] last:border-0"
          >
            <span className="text-[11px] text-tertiary tabular shrink-0 w-14">
              {formatTime(row.created_at)}
            </span>
            <span
              className={`text-[12px] truncate ${i === 0 ? "text-secondary" : "text-tertiary"}`}
            >
              {row.detail ?? row.action}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
