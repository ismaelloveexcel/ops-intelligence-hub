-- ============================================================================
-- Ops Intelligence Hub — Visibility Control Migration
-- Adds private/public visibility to execution_pipeline and feed_items.
-- Run this AFTER 001_initial.sql and 002_audit_log.sql.
-- ============================================================================

-- ─── Visibility Enum ──────────────────────────────────────────────────────────

CREATE TYPE visibility AS ENUM ('private', 'public');

-- ─── Add visibility to execution_pipeline ─────────────────────────────────────

ALTER TABLE execution_pipeline
  ADD COLUMN visibility visibility NOT NULL DEFAULT 'private';

-- ─── Add visibility to feed_items ─────────────────────────────────────────────

ALTER TABLE feed_items
  ADD COLUMN visibility visibility NOT NULL DEFAULT 'private';

-- ─── Update public_feed view to only show public items ────────────────────────

CREATE OR REPLACE VIEW public_feed AS
SELECT
  f.id,
  f.submission_id,
  f.title,
  f.what_changed,
  f.department,
  f.published_at,
  f.hours_saved,
  f.before_summary,
  f.after_summary
FROM feed_items f
WHERE f.visibility = 'public'
ORDER BY f.published_at DESC;
