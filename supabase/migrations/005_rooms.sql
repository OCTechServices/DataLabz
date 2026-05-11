-- ============================================================
-- Migration 005: Rooms + Room Members
-- ============================================================

create type room_status as enum ('active', 'paused', 'frozen', 'closed');

create table rooms (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  creator_id  uuid references profiles(id) on delete cascade not null,
  venue_id    uuid,                              -- populated in Phase 5
  stack_tags  text[] not null default '{}',
  status      room_status not null default 'active',
  closes_at   timestamptz not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table room_members (
  room_id    uuid references rooms(id) on delete cascade not null,
  user_id    uuid references profiles(id) on delete cascade not null,
  role       text not null default 'collaborator'
               check (role in ('creator', 'collaborator')),
  joined_at  timestamptz not null default now(),
  primary key (room_id, user_id)
);

-- updated_at trigger for rooms
create trigger rooms_updated_at
  before update on rooms
  for each row execute function set_updated_at();

-- ============================================================
-- RLS
-- ============================================================
alter table rooms enable row level security;
alter table room_members enable row level security;

-- Anyone authenticated can view non-closed rooms
create policy "rooms_select"
  on rooms for select
  to authenticated
  using (status != 'closed');

-- Only creator can insert
create policy "rooms_insert"
  on rooms for insert
  to authenticated
  with check (auth.uid() = creator_id);

-- Only creator can update their room
create policy "rooms_update"
  on rooms for update
  to authenticated
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

-- room_members: authenticated can view
create policy "room_members_select"
  on room_members for select
  to authenticated
  using (true);

-- room_members: anyone authenticated can insert their own membership
create policy "room_members_insert"
  on room_members for insert
  to authenticated
  with check (auth.uid() = user_id);

-- room_members: users can remove themselves; creator can remove anyone
create policy "room_members_delete"
  on room_members for delete
  to authenticated
  using (
    auth.uid() = user_id
    or auth.uid() = (select creator_id from rooms where id = room_id)
  );

-- ============================================================
-- Grants
-- ============================================================
grant select, insert, update on public.rooms to authenticated;
grant select, insert, delete on public.room_members to authenticated;
