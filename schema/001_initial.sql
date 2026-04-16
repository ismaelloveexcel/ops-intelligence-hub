-- ============================================================================
-- Ops Intelligence Hub — Full Database Schema
-- Run this in your Supabase SQL Editor to bootstrap the database.
-- ============================================================================

-- ─── Custom Enum Types ──────────────────────────────────────────────────────

CREATE TYPE submission_type   AS ENUM ('problem', 'suggestion', 'idea');
CREATE TYPE department        AS ENUM ('sales','operations','client_service','finance','admin','marketing','introducers','management','other');
CREATE TYPE frequency         AS ENUM ('daily','weekly','monthly','occasional');
CREATE TYPE impact_level      AS ENUM ('low','medium','high');
CREATE TYPE submission_status AS ENUM ('new','reviewing','accepted','in_progress','rejected','implemented');
CREATE TYPE action_type       AS ENUM ('quick_fix','sop_update','automation','training','escalate','reject');
CREATE TYPE review_category   AS ENUM ('automation','process','training','ignore');
CREATE TYPE impl_effort       AS ENUM ('quick','medium','heavy');
CREATE TYPE execution_status  AS ENUM ('planned','in_progress','testing','deployed','cancelled');
CREATE TYPE priority_level    AS ENUM ('low','medium','high','urgent');
CREATE TYPE ease_level        AS ENUM ('easy','medium','hard');

-- ─── 1. SUBMISSIONS ─────────────────────────────────────────────────────────

CREATE TABLE submissions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  submission_type      submission_type NOT NULL DEFAULT 'problem',
  submitted_by         TEXT,
  is_anonymous         BOOLEAN NOT NULL DEFAULT false,
  department           department NOT NULL,
  description          TEXT NOT NULL,
  process_name         TEXT,
  system_used          TEXT,
  time_per_occurrence  NUMERIC,            -- minutes per occurrence
  occurrences_per_week NUMERIC,            -- times per week
  frustration_level    SMALLINT CHECK (frustration_level BETWEEN 1 AND 5),
  error_risk           BOOLEAN NOT NULL DEFAULT false,
  affects_client       BOOLEAN NOT NULL DEFAULT false,
  involves_money       BOOLEAN NOT NULL DEFAULT false,
  frequency            frequency NOT NULL DEFAULT 'occasional',
  impact               impact_level NOT NULL DEFAULT 'medium',
  suggested_fix        TEXT,
  status               submission_status NOT NULL DEFAULT 'new'
);

CREATE INDEX idx_submissions_status     ON submissions(status);
CREATE INDEX idx_submissions_department ON submissions(department);
CREATE INDEX idx_submissions_created    ON submissions(created_at DESC);

-- ─── 2. REVIEW ACTIONS ─────────────────────────────────────────────────────

CREATE TABLE review_actions (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id                 UUID NOT NULL UNIQUE REFERENCES submissions(id) ON DELETE CASCADE,
  reviewed_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
  action_type                   action_type,
  priority                      priority_level,
  owner                         TEXT,
  target_date                   DATE,
  time_wasted_hrs               NUMERIC,
  ease                          ease_level,
  admin_notes                   TEXT,
  published_to_feed             BOOLEAN NOT NULL DEFAULT false,
  resolved_at                   TIMESTAMPTZ,
  automation_potential           SMALLINT CHECK (automation_potential BETWEEN 1 AND 5),
  implementation_effort          impl_effort,
  review_category                review_category,
  impact_level                   impact_level,
  estimated_hours_saved_monthly  NUMERIC
);

CREATE INDEX idx_review_submission ON review_actions(submission_id);

-- ─── 3. FEED ITEMS ──────────────────────────────────────────────────────────

CREATE TABLE feed_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   UUID REFERENCES submissions(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  what_changed    TEXT NOT NULL,
  department      department NOT NULL,
  published_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  hours_saved     NUMERIC,
  before_summary  TEXT,
  after_summary   TEXT
);

CREATE INDEX idx_feed_published ON feed_items(published_at DESC);

-- ─── 4. EXECUTION PIPELINE ─────────────────────────────────────────────────

CREATE TABLE execution_pipeline (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  linked_submission_id   UUID REFERENCES submissions(id) ON DELETE SET NULL,
  title                  TEXT NOT NULL,
  solution_type          TEXT,
  tool_used              TEXT,
  status                 execution_status NOT NULL DEFAULT 'planned',
  deployed_link          TEXT,
  before_time            NUMERIC,   -- minutes per occurrence before
  after_time             NUMERIC,   -- minutes per occurrence after
  actual_hours_saved     NUMERIC,
  notes                  TEXT
);

CREATE INDEX idx_pipeline_status ON execution_pipeline(status);

-- ─── 5. VIEWS ───────────────────────────────────────────────────────────────

-- Admin triage board: joins submissions + review_actions, computes scores
CREATE OR REPLACE VIEW admin_board AS
SELECT
  s.*,
  COALESCE(s.submitted_by, 'Anonymous') AS display_name,
  r.action_type,
  r.priority,
  r.owner,
  r.target_date,
  r.time_wasted_hrs,
  r.ease,
  r.admin_notes,
  r.published_to_feed,
  r.resolved_at,
  r.reviewed_at,
  r.automation_potential,
  r.implementation_effort,
  r.review_category,
  r.impact_level,
  r.estimated_hours_saved_monthly,
  -- Derived: hours wasted per month = (time_per_occurrence × occurrences_per_week × 4) / 60
  CASE
    WHEN s.time_per_occurrence IS NOT NULL AND s.occurrences_per_week IS NOT NULL
    THEN ROUND((s.time_per_occurrence * s.occurrences_per_week * 4) / 60, 2)
    ELSE NULL
  END AS hours_wasted_month,
  -- Derived: priority_score = hours_wasted_month × automation_potential × frustration_level
  CASE
    WHEN s.time_per_occurrence IS NOT NULL
     AND s.occurrences_per_week IS NOT NULL
     AND r.automation_potential IS NOT NULL
     AND s.frustration_level IS NOT NULL
    THEN ROUND(
      ((s.time_per_occurrence * s.occurrences_per_week * 4) / 60)
      * r.automation_potential
      * s.frustration_level, 2)
    ELSE NULL
  END AS priority_score
FROM submissions s
LEFT JOIN review_actions r ON r.submission_id = s.id;

-- Public feed view
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
ORDER BY f.published_at DESC;

-- ─── 6. ROW LEVEL SECURITY ─────────────────────────────────────────────────

ALTER TABLE submissions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_actions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_pipeline ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for submissions (public form)
CREATE POLICY "Allow public inserts" ON submissions
  FOR INSERT WITH CHECK (true);

-- Allow service-role full access (admin)
CREATE POLICY "Service role full access on submissions" ON submissions
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on review_actions" ON review_actions
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on feed_items" ON feed_items
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on execution_pipeline" ON execution_pipeline
  FOR ALL USING (auth.role() = 'service_role');

-- Allow public read on feed_items
CREATE POLICY "Allow public select on feed_items" ON feed_items
  FOR SELECT USING (true);
