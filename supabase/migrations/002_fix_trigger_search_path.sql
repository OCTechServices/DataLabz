-- Migration 002: Fix handle_new_user trigger search_path
-- Without set search_path = public, Supabase auth context cannot
-- resolve the profiles table reference inside the security definer function.

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer set search_path = public;
