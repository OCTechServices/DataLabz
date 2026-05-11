-- Migration 013: Theme preference + custom CSS per user profile
-- theme: controls Virtual Hive world visual style
-- custom_css: MySpace-style personal CSS, injected client-side only (sanitized before save)

alter table profiles
  add column theme text not null default 'pixel-dark',
  add column custom_css text;

-- Allow authenticated users to update their own theme preferences
-- (existing UPDATE policy on profiles already covers this via RLS)
