-- ============================================================
-- Migration 001: Profiles
-- Creates the profiles table, RLS policies, and signup trigger
-- ============================================================

-- Visibility enum
create type visibility_status as enum ('online', 'away', 'offline');

-- Profiles table (extends auth.users)
create table profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  display_name  text not null,
  avatar_url    text,
  visibility    visibility_status not null default 'offline',
  updated_at    timestamptz not null default now()
);

-- Updated_at trigger
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- RLS
-- ============================================================
alter table profiles enable row level security;

-- Anyone authenticated can read profiles (needed for the Hive)
create policy "profiles_select"
  on profiles for select
  to authenticated
  using (true);

-- Users can only update their own profile
create policy "profiles_update"
  on profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Insert handled by trigger (security definer), not direct client writes
