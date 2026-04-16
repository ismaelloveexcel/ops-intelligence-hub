-- ============================================================================
-- Ops Intelligence Hub — Admin Audit Log
-- Run this in your Supabase SQL Editor after 001_initial.sql.
-- ============================================================================

-- ─── Admin Audit Log ────────────────────────────────────────────────────────

CREATE TABLE admin_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  action      TEXT NOT NULL,         -- e.g. 'review_saved', 'pipeline_created'
  entity_type TEXT NOT NULL,         -- e.g. 'submission', 'pipeline', 'session'
  entity_id   TEXT,                  -- UUID or identifier of the affected entity
  summary     TEXT                   -- human-readable description of what happened
);

CREATE INDEX idx_audit_log_created ON admin_audit_log(created_at DESC);
CREATE INDEX idx_audit_log_action  ON admin_audit_log(action);

-- RLS: only service_role can read/write audit logs
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on admin_audit_log" ON admin_audit_log
  FOR ALL USING (auth.role() = 'service_role');
