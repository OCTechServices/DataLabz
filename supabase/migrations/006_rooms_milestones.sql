-- Migration 006: Add milestones to rooms
-- Milestones are stored as JSONB: [{ id, text, done }]
-- A room cannot be active without at least one milestone.

alter table rooms add column milestones jsonb not null default '[]';
