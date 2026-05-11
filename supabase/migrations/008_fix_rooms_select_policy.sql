-- Migration 008: Fix rooms_select RLS policy
-- PostgreSQL requires the new row after an UPDATE to satisfy the SELECT policy.
-- When closing a room (status='closed'), the old SELECT policy (status != 'closed')
-- rejects the updated row, causing a 42501 violation.
-- Fix: allow creators to always see their own rooms regardless of status.
-- Non-creators still only see non-closed rooms on the Hive board.

drop policy "rooms_select" on rooms;
create policy "rooms_select"
  on rooms for select
  to authenticated
  using (status != 'closed' or auth.uid() = creator_id);
