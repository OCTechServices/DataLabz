-- Migration 004: Grant table privileges to authenticated role
-- RLS policies control row access, but the role also needs
-- table-level GRANT before it can execute any operation.

grant select, insert, update on public.profiles to authenticated;
