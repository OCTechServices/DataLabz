-- Migration 009: Add links to rooms
-- Links stored as JSONB: [{ id, label, url }]
-- Optional — not required to go active.

alter table rooms add column links jsonb not null default '[]';
