-- ============================================================================
-- Ops Intelligence Hub — Migration 006: Three-Tier Visibility
-- Adds 'internal' to the visibility and project_visibility enums.
--
-- Three-tier semantics:
--   private   — visible only to operator in /admin/pipeline; never in
--               reports, dashboard metrics, public feed, or PDF
--   internal  — visible in dashboard and reports; NOT on public feed
--               (default for company work)
--   public    — visible everywhere including /updates feed
--
-- Run AFTER 005_kpi_and_ai.sql.
-- ============================================================================

-- Add 'internal' value to the shared visibility enum (used by
-- execution_pipeline and feed_items).
ALTER TYPE visibility ADD VALUE IF NOT EXISTS 'internal';

-- Add 'internal' value to the project-specific enum.
ALTER TYPE project_visibility ADD VALUE IF NOT EXISTS 'internal';

-- ─── Update public_feed view ─────────────────────────────────────────────────
-- Rebuild to use explicit filter so 'internal' rows are never exposed.
-- (View already filtered by visibility = 'public'; rebuild is idempotent.)
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
  f.after_summary,
  f.visibility,
  f.kpi_area,
  f.shoutout
FROM feed_items f
WHERE f.visibility = 'public'
ORDER BY f.published_at DESC;

-- ─── Notes ───────────────────────────────────────────────────────────────────
-- No data migration needed: existing rows are either 'private' or 'public'.
-- The restrictive RLS policy on feed_items (feed_items_public_select_only)
-- already uses visibility = 'public' and remains correct unchanged.
