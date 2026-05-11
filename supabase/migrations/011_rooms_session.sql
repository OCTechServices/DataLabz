-- Migration 011: Add session number to rooms
-- Tracks which session a room belongs to within a project arc.
-- Default 1 — existing rooms are Session 1.
-- Clone increments: Session 1 → Session 2 → Session 3.

alter table rooms add column session integer not null default 1;
