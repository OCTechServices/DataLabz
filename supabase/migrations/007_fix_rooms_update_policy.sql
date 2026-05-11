-- Migration 007: Fix rooms_update RLS policy
-- The with check (auth.uid() = creator_id) conflicts with the SELECT policy
-- that excludes closed rooms. After setting status=closed, PostgREST tries
-- to read the updated row back, but the SELECT policy blocks it, causing a
-- policy violation. Removing with check fixes this — the using clause
-- already ensures only the creator can update their own rooms.

drop policy "rooms_update" on rooms;
create policy "rooms_update"
  on rooms for update
  to authenticated
  using (auth.uid() = creator_id);
