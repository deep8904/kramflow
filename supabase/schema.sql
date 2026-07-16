-- KramFlow schema — run once in the Supabase SQL editor on a fresh project.
-- See docs/ARCHITECTURE.md and the restructure plan for the reasoning behind
-- each table. Idempotent: safe to re-run (uses IF NOT EXISTS / CREATE OR REPLACE).

-- ---------------------------------------------------------------------------
-- sessions
-- ---------------------------------------------------------------------------
create table if not exists sessions (
  id text primary key,
  sheet_name text not null,
  event_name text not null,
  day_label text not null,
  session_label text not null,
  sort_order integer not null default 0
);

-- ---------------------------------------------------------------------------
-- programs
-- Note: "order" is a reserved SQL word, so the sequence-position column is
-- named sort_order here (mirrors sessions.sort_order); the app's Program
-- type maps it to `order` at the data-access boundary (lib/data/sessions.ts).
-- ---------------------------------------------------------------------------
create table if not exists programs (
  id uuid primary key default gen_random_uuid(),
  sort_order integer not null,
  session_id text not null references sessions(id) on delete cascade,
  section_label text,
  type text not null default 'item' check (type in ('item', 'break')),
  name text not null,
  description text,
  presenter text,
  presenter_requirement text,
  presenter_contact text,
  duration integer not null default 0,
  start_time text,
  end_time text,
  audio_mics boolean not null default false,
  audio_track boolean not null default false,
  video_sidescreen text not null default 'none' check (video_sidescreen in ('none', 'slides', 'live_feed')),
  backdrop boolean not null default false,
  video_ppt_needed boolean not null default false,
  hall_lights text,
  stage_lights text,
  camera_angle text,
  props text,
  curtains text check (curtains in ('open', 'closed')),
  remarks text,
  status text not null default 'confirmed' check (status in ('confirmed', 'draft', 'cut', 'tbd')),
  color_tag text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text
);

create index if not exists programs_session_id_idx on programs(session_id);
create unique index if not exists programs_session_sort_order_idx on programs(session_id, sort_order);

-- ---------------------------------------------------------------------------
-- live_state — singleton row, kept small by design (see ARCHITECTURE.md)
-- ---------------------------------------------------------------------------
create table if not exists live_state (
  id smallint primary key default 1 check (id = 1),
  active_session_id text references sessions(id),
  paused_at timestamptz,
  alert jsonb,
  progress_by_session jsonb not null default '{}'::jsonb,
  notes_overrides jsonb not null default '{}'::jsonb,
  presenter_state jsonb not null default '{"note": null, "flashAt": null}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into live_state (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- activity_log — short operator action history, not analytics (see plan)
-- ---------------------------------------------------------------------------
create table if not exists activity_log (
  id bigint generated always as identity primary key,
  action text not null,
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists activity_log_created_at_idx on activity_log(created_at desc);

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- Public (anon) reads only. All writes go through Next.js API routes using
-- the service_role key, which bypasses RLS entirely — no write policies are
-- defined here on purpose.
-- ---------------------------------------------------------------------------
alter table sessions enable row level security;
alter table programs enable row level security;
alter table live_state enable row level security;
alter table activity_log enable row level security;

drop policy if exists "public read sessions" on sessions;
create policy "public read sessions" on sessions for select using (true);

drop policy if exists "public read programs" on programs;
create policy "public read programs" on programs for select using (true);

drop policy if exists "public read live_state" on live_state;
create policy "public read live_state" on live_state for select using (true);

drop policy if exists "public read activity_log" on activity_log;
create policy "public read activity_log" on activity_log for select using (true);

-- ---------------------------------------------------------------------------
-- Realtime — enable change broadcasts for the tables clients subscribe to.
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table sessions;
alter publication supabase_realtime add table programs;
alter publication supabase_realtime add table live_state;
