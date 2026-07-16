"use client";

import { createClient } from "@supabase/supabase-js";

// Anon browser client — public reads + Realtime subscriptions only. RLS
// (supabase/schema.sql) restricts this key to select on
// sessions/programs/live_state; all writes go through API routes using the
// service-role client (lib/supabase/server.ts) instead.
let browserClient: ReturnType<typeof createClient> | null = null;

export function supabaseBrowser() {
  if (browserClient) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set");
  }
  browserClient = createClient(url, key);
  return browserClient;
}
