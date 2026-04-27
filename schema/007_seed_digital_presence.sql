-- ============================================================================
-- Ops Intelligence Hub — Migration 007: Digital Presence Seed Data
-- Inserts initial project, pipeline items, tasks, and scratchpad note for
-- the Arie Finance digital presence workstream.
-- All items are private by default.
--
-- Run AFTER 006_pipeline_visibility.sql.
-- ============================================================================

-- ─── Project ─────────────────────────────────────────────────────────────────

INSERT INTO projects (title, description, status, visibility, kpi_area, notes)
VALUES (
  'Arie Finance — Digital Presence & Content',
  'Website fixes, content strategy, social media, and company-facing tools to close the digital presence gap identified in the April 2026 audit.',
  'active',
  'private',
  'marketing',
  'Personal project — manage visibility per item before surfacing to leadership.'
);

-- ─── Pipeline Items ──────────────────────────────────────────────────────────
-- Use a CTE so the newly inserted project id can be referenced inline.

WITH inserted_project AS (
  SELECT id FROM projects
  WHERE title = 'Arie Finance — Digital Presence & Content'
  ORDER BY created_at DESC
  LIMIT 1
)
INSERT INTO execution_pipeline (title, notes, solution_category, status, kpi_area, visibility, project_id, updated_at)
SELECT
  item.title,
  item.notes,
  item.solution_category::solution_category,
  item.status::execution_status,
  item.kpi_area::kpi_area,
  'private'::visibility,
  inserted_project.id,
  now()
FROM inserted_project,
(VALUES
  (
    'Content Hub — LinkedIn & Newsletter Workflow',
    'AI-assisted content calendar, post drafting, approval workflow before publishing. For use by AI & Automation Lead and leadership.',
    'automation',
    'planned',
    'marketing'
  ),
  (
    'Lead Intake System — Book a Call Form',
    'Capture prospects from website "Book a call" CTA. Auto-route to right person, AI-drafted follow-up, tracked in pipeline.',
    'automation',
    'planned',
    'sales'
  ),
  (
    'Client Newsletter System',
    'Monthly Arie Insights newsletter. AI assembles from market updates + wins. Operator edits and sends.',
    'automation',
    'planned',
    'marketing'
  ),
  (
    'Partner Portal',
    'Introducers submit referrals, track status, receive automated packs and commission updates.',
    'automation',
    'planned',
    'introducers'
  ),
  (
    'Website Critical Fixes',
    'Fix $400m/$600m inconsistency on About page. Update copyright to 2026. Add FSC licence number to homepage. Address office.acbm.mu login branding.',
    'process_change',
    'in_progress',
    'marketing'
  )
) AS item(title, notes, solution_category, status, kpi_area);

-- ─── Operator Tasks ──────────────────────────────────────────────────────────

WITH inserted_project AS (
  SELECT id FROM projects
  WHERE title = 'Arie Finance — Digital Presence & Content'
  ORDER BY created_at DESC
  LIMIT 1
)
INSERT INTO operator_tasks (title, source, status, kpi_area, project_id)
SELECT
  task.title,
  'self'::task_source,
  'todo'::task_status,
  'marketing'::kpi_area,
  inserted_project.id
FROM inserted_project,
(VALUES
  ('Flag $400m/$600m fix to web team'),
  ('Flag copyright 2025 → 2026 to web team'),
  ('Flag FSC licence number to leadership for approval'),
  ('Draft first LinkedIn post via Automation Lab'),
  ('Draft first founder thought leadership post'),
  ('Scope Content Hub build — requirements and stack')
) AS task(title);

-- ─── Scratchpad Note ─────────────────────────────────────────────────────────

INSERT INTO scratchpad (title, kpi_area, is_private, content_md)
VALUES (
  'Digital Presence Audit — Key Findings',
  'marketing',
  true,
  '## Critical Issues (Fix Immediately)
- About page: $400m vs $600m inconsistency — fix today
- Footer: © 2025 — update to 2026
- Login redirects to office.acbm.mu (unbranded domain)
- No FSC licence number on homepage

## LinkedIn Status
- 835 followers, effectively dormant since 2022-2023
- Competitor AfrAsia Bank: 32,757 followers, posts weekly
- ZoomInfo flags Arie as "very low activity" — external signal

## Website Scores
- Design: 7/10
- Messaging: 5/10
- Services page: 3/10
- Content/thought leadership: 1/10
- SEO: 3/10

## Biggest Gaps
- No blog or thought leadership content
- No softer CTA (only "Open an account")
- Africa expertise buried — should be a differentiator
- Testimonials fully anonymous — no company or sector

## Tools to Build for Arie (separate from personal tool)
- Content Hub
- Lead Intake (Book a call)
- Newsletter System
- Partner Portal

## Competitor Notes
- AfrAsia Bank is the closest comparable
- Same Africa-Asia bridge story but 40x more LinkedIn presence
- Gap is not the product — gap is the communication of it'
);
