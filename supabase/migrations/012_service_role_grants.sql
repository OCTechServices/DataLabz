-- Migration 012: Grant service_role full access to venues and check_ins
-- Required for admin API routes that use the service role client.
-- service_role bypasses RLS but still needs table-level grants in PostgREST.

grant select, insert, update, delete on public.venues to service_role;
grant select, insert, update, delete on public.check_ins to service_role;
