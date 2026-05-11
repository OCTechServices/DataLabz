-- Migration 003: Add INSERT policy for profiles
-- The trigger handles inserts for new signups, but authenticated users
-- also need INSERT rights as a fallback (e.g. if trigger ran before fix,
-- or if profile setup form needs to create the row directly).

create policy "profiles_insert"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);
