import { createClient } from "@supabase/supabase-js";

// Service-role client — server-only, bypasses RLS. Used exclusively by API
// routes and scripts/seed.ts for writes (see supabase/schema.sql: no public
// insert/update/delete policies are defined, so this key is the only way to
// write). Never import this from a "use client" component or anything that
// ships to the browser — no consumer currently does (verified: only
// app/api/* routes and scripts/seed.ts import this module) — the
// `server-only` package's guard was removed because it fires outside
// Next's bundler context too, breaking the standalone seed script.
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
