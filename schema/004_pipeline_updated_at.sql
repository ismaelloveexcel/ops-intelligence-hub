-- ============================================================================
-- Ops Intelligence Hub — Updated At Tracking Migration
-- Adds updated_at column to execution_pipeline for accurate "stuck" detection.
-- Run this AFTER 003_visibility.sql.
-- ============================================================================

-- ─── Add updated_at to execution_pipeline ─────────────────────────────────────

ALTER TABLE execution_pipeline
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Backfill existing rows: set updated_at = created_at
UPDATE execution_pipeline
SET updated_at = created_at;

-- Index for efficient stuck-item queries
CREATE INDEX idx_pipeline_updated_at ON execution_pipeline(updated_at);
