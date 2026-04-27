-- ============================================================================
-- Ops Intelligence Hub — Migration 005: KPI Tagging, AI Fields, New Tables
-- Run this in your Supabase SQL Editor in order after 001–004.
-- ============================================================================

-- ─── New Enum Types ──────────────────────────────────────────────────────────

CREATE TYPE kpi_area AS ENUM (
  'sales', 'marketing', 'introducers', 'client_service',
  'reporting', 'sops', 'finance', 'ai_knowledge', 'general_ops'
);

CREATE TYPE solution_category AS ENUM (
  'automation', 'process_change', 'training',
  'tool_purchase', 'policy_change'
);

CREATE TYPE project_status AS ENUM ('private', 'active', 'completed', 'archived');
CREATE TYPE project_visibility AS ENUM ('private', 'public');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done');
CREATE TYPE task_source AS ENUM ('self', 'management', 'ad_hoc', 'cross_functional');
CREATE TYPE sop_status AS ENUM ('draft', 'approved', 'published');
CREATE TYPE report_status AS ENUM ('draft', 'sent');

-- ─── Extend submissions ──────────────────────────────────────────────────────

ALTER TABLE submissions
  ADD COLUMN kpi_area          kpi_area,
  ADD COLUMN ai_kpi_area       kpi_area,
  ADD COLUMN ai_urgency_score  SMALLINT CHECK (ai_urgency_score BETWEEN 1 AND 10),
  ADD COLUMN ai_suggested_action TEXT,
  ADD COLUMN ai_reasoning      TEXT,
  ADD COLUMN ai_classified_at  TIMESTAMPTZ,
  ADD COLUMN ai_cluster_id     UUID,
  ADD COLUMN submitter_email   TEXT;

-- ─── Extend review_actions ───────────────────────────────────────────────────

ALTER TABLE review_actions
  ADD COLUMN ai_assisted  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN ai_prefill   JSONB;

-- NOTE (deprecated): action_type, ease, time_wasted_hrs are superseded by
-- review_category, implementation_effort, and estimated_hours_saved_monthly.
-- They remain for backward compatibility. Do not write new values to them.

-- ─── Extend execution_pipeline ──────────────────────────────────────────────

ALTER TABLE execution_pipeline
  ADD COLUMN kpi_area              kpi_area,
  ADD COLUMN solution_category     solution_category,
  ADD COLUMN submitter_notified_at TIMESTAMPTZ,
  ADD COLUMN project_id            UUID;  -- FK added after projects table is created

-- ─── Extend feed_items ───────────────────────────────────────────────────────

ALTER TABLE feed_items
  ADD COLUMN kpi_area    kpi_area,
  ADD COLUMN ai_drafted  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN shoutout    TEXT;

-- ─── Extend admin_audit_log ──────────────────────────────────────────────────

ALTER TABLE admin_audit_log
  ADD COLUMN actor_email TEXT,
  ADD COLUMN ip_address  INET,
  ADD COLUMN user_agent  TEXT;

-- ─── New Table: projects ─────────────────────────────────────────────────────

CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  status      project_status NOT NULL DEFAULT 'private',
  visibility  project_visibility NOT NULL DEFAULT 'private',
  kpi_area    kpi_area,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE execution_pipeline
  ADD CONSTRAINT fk_pipeline_project
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- ─── New Table: operator_tasks ───────────────────────────────────────────────

CREATE TABLE operator_tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  description      TEXT,
  status           task_status NOT NULL DEFAULT 'todo',
  kpi_area         kpi_area,
  project_id       UUID REFERENCES projects(id) ON DELETE SET NULL,
  source           task_source NOT NULL DEFAULT 'self',
  promote_to_pipeline BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at     TIMESTAMPTZ
);

-- ─── New Table: scratchpad ───────────────────────────────────────────────────

CREATE TABLE scratchpad (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  content_md  TEXT,
  kpi_area    kpi_area,
  is_private  BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── New Table: lab_sessions ─────────────────────────────────────────────────

CREATE TABLE lab_sessions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  input_text           TEXT NOT NULL,
  kpi_area             kpi_area,
  linked_submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
  linked_project_id    UUID REFERENCES projects(id) ON DELETE SET NULL,
  ai_output            TEXT,
  automation_score     SMALLINT,
  saved_to_notes       BOOLEAN NOT NULL DEFAULT false,
  promoted_to_pipeline BOOLEAN NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── New Table: sop_drafts ───────────────────────────────────────────────────

CREATE TABLE sop_drafts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
  source_pipeline_id  UUID REFERENCES execution_pipeline(id) ON DELETE SET NULL,
  kpi_area            kpi_area,
  title               TEXT NOT NULL,
  content_md          TEXT,
  status              sop_status NOT NULL DEFAULT 'draft',
  ai_drafted          BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── New Table: report_runs ──────────────────────────────────────────────────

CREATE TABLE report_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  range_label   TEXT,
  kpi_summary   JSONB,
  narrative_md  TEXT,
  pdf_url       TEXT,
  sent_to       TEXT[],
  status        report_status NOT NULL DEFAULT 'draft'
);

-- ─── New Table: app_config ───────────────────────────────────────────────────

CREATE TABLE app_config (
  key    TEXT PRIMARY KEY,
  value  TEXT
);

INSERT INTO app_config (key, value) VALUES
  ('resend_from',          'noreply@placeholder.com'),
  ('report_recipients',    '[]'),
  ('hourly_rate',          NULL),
  ('setup_complete',       'false')
ON CONFLICT (key) DO NOTHING;

-- ─── New Table: pending_notifications ────────────────────────────────────────
-- Stores AI-drafted acknowledgement emails awaiting operator approval.

CREATE TABLE pending_notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   UUID REFERENCES submissions(id) ON DELETE CASCADE,
  submitter_email TEXT NOT NULL,
  submitter_name  TEXT,
  subject         TEXT NOT NULL,
  body_html       TEXT NOT NULL,
  trigger_status  TEXT NOT NULL,  -- 'accepted' or 'implemented'
  sent_at         TIMESTAMPTZ,
  dismissed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Updated Views ───────────────────────────────────────────────────────────

-- Rebuild admin_board to include AI fields
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
  r.ai_assisted,
  r.ai_prefill,
  CASE
    WHEN s.time_per_occurrence IS NOT NULL AND s.occurrences_per_week IS NOT NULL
    THEN ROUND((s.time_per_occurrence * s.occurrences_per_week * 4) / 60, 2)
    ELSE NULL
  END AS hours_wasted_month,
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

-- Rebuild public_feed to include kpi_area and shoutout
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

-- ─── Row Level Security on New Tables ────────────────────────────────────────

ALTER TABLE projects               ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_tasks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE scratchpad             ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_sessions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_drafts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_runs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config             ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_notifications  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on projects"
  ON projects FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on operator_tasks"
  ON operator_tasks FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on scratchpad"
  ON scratchpad FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on lab_sessions"
  ON lab_sessions FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on sop_drafts"
  ON sop_drafts FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on report_runs"
  ON report_runs FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on app_config"
  ON app_config FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on pending_notifications"
  ON pending_notifications FOR ALL USING (auth.role() = 'service_role');
