-- ============================================================
-- Migration 010: Venues + Check-ins
-- ============================================================

-- Venues: physical locations (cafés, co-working spaces, etc.)
create table venues (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  code        text not null unique,           -- short code encoded in QR, e.g. 'brew42'
  address     text,
  lat         numeric(9, 6),
  lng         numeric(9, 6),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Check-ins: records a user's presence at a venue
create table check_ins (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references profiles(id) on delete cascade not null,
  venue_id    uuid references venues(id) on delete cascade not null,
  token       uuid default gen_random_uuid() not null unique,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

-- Index for fast active check-in lookups
create index check_ins_user_active on check_ins (user_id, expires_at);

-- ============================================================
-- RLS
-- ============================================================
alter table venues enable row level security;
alter table check_ins enable row level security;

-- Venues: anyone authenticated can read active venues
create policy "venues_select"
  on venues for select
  to authenticated
  using (active = true);

-- Check-ins: users can read their own check-ins
create policy "check_ins_select"
  on check_ins for select
  to authenticated
  using (auth.uid() = user_id);

-- Check-ins: users can insert their own check-ins
create policy "check_ins_insert"
  on check_ins for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Check-ins: users can delete their own check-ins (manual checkout)
create policy "check_ins_delete"
  on check_ins for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================
-- Grants
-- ============================================================
grant select on public.venues to authenticated;
grant select, insert, delete on public.check_ins to authenticated;
