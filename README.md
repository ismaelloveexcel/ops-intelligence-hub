# Operations Intelligence Hub

> **Making Work Easier — an internal system for capturing operational improvements at ARIE Finance.**
> Employees share what slows them down, and the operations team turns that feedback into real improvements. The aim is to reduce unnecessary steps and make day-to-day work smoother.

---

## What This Is

Operations Intelligence Hub is a central system for:

- **Employee feedback** — anyone in the company can share what takes too long, feels repetitive, or could be simpler
- **Operational improvements** — structured capture of bottlenecks and inefficiencies
- **Automation prioritisation** — scoring system that surfaces the biggest problems and quickest wins
- **Execution tracking** — pipeline view of what's being built and deployed
- **Impact measurement** — hours wasted vs hours saved, before/after comparisons
- **"From Feedback to Action" feed** — visible proof that employee input leads to real change
- **Management reporting** — structured reports for leadership updates

The goal: **identify problems, fix them, and show the results.**

---

## Who It's For

| Role | How they use it |
|------|----------------|
| **AI & Automation Lead** | Reviews submissions, scores automation potential, tracks execution, reports to management |
| **All employees** | Submit problems, suggestions, or quick ideas via the `/submit` form |
| **Management** | Views dashboard for bottleneck/impact reporting, sees the public feed |

---

## Product Modules

### 1. Submissions (`/submit`)
Employee-facing form branded as **"Making Work Easier"**. Supports three types:
- **Problem** — full structured form with process name, system, time metrics, frustration level, risk flags
- **Suggestion** — structured improvement proposal
- **Quick Idea** — lightweight, just department + description

Key fields: `submission_type`, `process_name`, `system_used`, `time_per_occurrence`, `occurrences_per_week`, `frustration_level` (1–5), `error_risk`, `affects_client`, `involves_money`

### 2. Review Engine (`/admin/[id]`)
Admin review and scoring interface:
- `automation_potential` (1–5 button grid)
- `implementation_effort` (Quick / Medium / Heavy)
- `review_category` (Automation / Process / Training / Ignore)
- `impact_level`, `estimated_hours_saved_monthly`
- Computed **priority score** displayed in real-time
- Status progression: New → Reviewing → Accepted → In Progress → Implemented

### 3. Execution Pipeline (`/admin/pipeline`)
Delivery tracking module:
- `solution_type`, `tool_used`, `status` (Planned → Deployed)
- `before_time`, `after_time`, `actual_hours_saved`
- `deployed_link`, `notes`

### 4. Dashboard (`/admin/dashboard`)
Internal analytics:
- Total submissions, hours wasted/month, hours saved, deployments
- **Conversion rate** (% of submissions that reached accepted/in_progress/implemented)
- **Quick wins count** (high automation potential + quick effort)
- Status breakdown, department breakdown
- **Top bottlenecks** (highest hours wasted, excluding completed)
- **Quick wins** (high automation potential + quick effort)

### 5. Public Feed (`/updates`)
"From Feedback to Action" with:
- Hours saved badges
- Before vs after summaries
- Monthly grouping

---

## Workflow Loop

```
Employee submits → Admin reviews & scores → Priority list generated →
Build/deploy tracked in pipeline → Published to "From Feedback to Action" →
Employees see impact → More submissions → Cycle continues
```

---

## Prioritisation Logic

### Hours Wasted per Month
```
hours_wasted_month = (time_per_occurrence × occurrences_per_week × 4) / 60
```

### Priority Score
```
priority_score = hours_wasted_month × automation_potential × frustration_level
```

This surfaces items that are **frequent, painful, and automatable**.

---

## Data Model

Full schema: [`schema/001_initial.sql`](./schema/001_initial.sql), [`schema/002_audit_log.sql`](./schema/002_audit_log.sql), [`schema/003_visibility.sql`](./schema/003_visibility.sql)

| Table | Purpose |
|-------|---------|
| `submissions` | Employee submissions with structured fields |
| `review_actions` | Admin review scoring (1:1 with submissions) |
| `feed_items` | Published "From Feedback to Action" entries (with visibility control) |
| `execution_pipeline` | Delivery tracking items (with visibility control) |
| `admin_audit_log` | Audit trail for admin actions (review, publish, pipeline CRUD, login/logout) |

| View | Purpose |
|------|---------|
| `admin_board` | Joins submissions + review_actions, computes `hours_wasted_month` and `priority_score` |
| `public_feed` | Read-only feed view |

---

## Routes

| Route | Visibility | Description |
|-------|-----------|-------------|
| `/` | Public | Homepage — stats + recent fixes |
| `/submit` | Public | Employee submission form (3 types) |
| `/submit/done` | Public | Confirmation screen |
| `/updates` | Public | Full "From Feedback to Action" feed |
| `/admin/login` | Public | Admin login page |
| `/admin` | Admin (protected) | Triage board — all submissions |
| `/admin/[id]` | Admin (protected) | Review + score + publish |
| `/admin/dashboard` | Admin (protected) | Analytics dashboard |
| `/admin/pipeline` | Admin (protected) | Execution pipeline tracker |
| `/admin/pipeline/new` | Admin (protected) | Create pipeline item |
| `/admin/reports` | Admin (protected) | Management report generation |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/submissions` | Create submission (rate-limited) |
| `POST` | `/api/auth/admin-login` | Authenticate admin — sets session cookie |
| `GET/POST` | `/api/auth/admin-logout` | Clear session cookie (GET redirects to login) |
| `GET` | `/api/admin/submissions/[id]` | Fetch admin board row |
| `PATCH` | `/api/admin/submissions/[id]` | Upsert review + update status |
| `POST` | `/api/admin/submissions/[id]/publish` | Publish to feed |
| `GET` | `/api/admin/dashboard` | Dashboard metrics |
| `GET` | `/api/admin/reports` | Generate management reports |
| `GET/POST` | `/api/admin/pipeline` | List/create pipeline items |
| `PATCH/DELETE` | `/api/admin/pipeline/[id]` | Update/delete pipeline item |

---

## Security

### Current Protection (Temporary — Internal Tool)

| Feature | Implementation |
|---------|---------------|
| **Admin login gate** | `/admin/login` — password form that authenticates against `ADMIN_API_SECRET` |
| **Page-level protection** | Next.js middleware redirects all `/admin/*` page visits to login if not authenticated |
| **API-level protection** | Same middleware rejects all `/api/admin/*` calls with 401 if not authenticated |
| **Defence-in-depth** | Individual API routes also call `validateAdminRequest()` as a secondary check |
| **HMAC session token** | Cookie stores an HMAC-SHA256 derived token (not the raw secret) — prevents secret leakage even if cookie is exposed |
| **Session cookie** | `ops-admin-token` — HttpOnly, SameSite=Lax, Secure in production, 7-day expiry |
| **Timing-safe comparison** | Login and token validation both use `timingSafeEqual` |
| **Admin audit log** | All admin mutations (review, publish, pipeline CRUD, login/logout) are logged to `admin_audit_log` table |
| **No unsafe fallback** | `supabaseAdmin` throws if `SUPABASE_SERVICE_ROLE_KEY` is missing — never silently falls back to anon key |
| **Rate limiting** | 10 submissions per 15 minutes per IP on the public endpoint |
| **Input validation** | All API routes validate types, ranges, and required fields |
| **Lazy client init** | Both Supabase clients use `Proxy` to avoid build-time crashes |
| **RLS enabled** | Row-level security on all tables in the schema |

### Admin Audit Log

All admin actions are logged to the `admin_audit_log` table with:
- `action` — what happened (`review_saved`, `submission_published`, `pipeline_created`, `pipeline_updated`, `pipeline_deleted`, `admin_login`, `admin_logout`)
- `entity_type` — what it affected (`submission`, `pipeline`, `session`)
- `entity_id` — which record was affected
- `summary` — human-readable description
- `created_at` — timestamp

Schema: [`schema/002_audit_log.sql`](./schema/002_audit_log.sql)

### What This Is NOT

This is **not** a production-grade auth system. Specifically:

- There is **no user management** — a single shared password (`ADMIN_API_SECRET`) grants admin access
- The session token is an HMAC-SHA256 derivation — it is HttpOnly and not the raw secret, but it is deterministic (not a unique session ID)
- There is **no role-based access control** — you are either an admin or you are not
- **Development mode** with no `ADMIN_API_SECRET` set bypasses all protection with a console warning

### Recommended Future Auth

For production hardening, replace the password gate with one of:
- **Supabase Auth** — email/magic link login with RLS policies
- **NextAuth.js** — OAuth provider (Google, GitHub) scoped to company domain
- **Vercel Password Protection** — zero-code page-level auth (Vercel Pro feature)

---

## Setup

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/ops-intelligence-hub.git
cd ops-intelligence-hub
npm install
```

### 2. Supabase
Create a project at [supabase.com](https://supabase.com). Run [`schema/001_initial.sql`](./schema/001_initial.sql), [`schema/002_audit_log.sql`](./schema/002_audit_log.sql), and [`schema/003_visibility.sql`](./schema/003_visibility.sql) in the SQL editor.

### 3. Environment
Copy `.env.local.example` → `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_API_SECRET=a-strong-random-secret
```

### 4. Run
```bash
npm run dev
```

### 5. Deploy
Push to GitHub → connect in [Vercel](https://vercel.com) → add env vars → deploy.

---

## Required Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Server-side admin operations |
| `ADMIN_API_SECRET` | Recommended | Protects admin API routes |
| `RESEND_API_KEY` | Optional | Email notifications via Resend |
| `ADMIN_EMAIL` | Optional | Recipient for submission alerts |
| `NEXT_PUBLIC_APP_URL` | Optional | Used in email links |

---

## Business Context

This tool supports the AI & Automation Lead's areas of responsibility at ARIE Finance:

1. **Sales & lead management** — identify manual CRM tasks, proposal bottlenecks
2. **Marketing automation** — surface repetitive content/campaign tasks
3. **Introducer & partner management** — track referral/commission pain points
4. **Client service & support** — capture support workflow inefficiencies
5. **Management reporting** — dashboard data feeds into weekly reporting
6. **SOPs and internal operations** — digitise and track SOP improvements
7. **Finance-support processes** — surface invoice/payment workflow issues
8. **Internal AI / knowledge tools** — ideas for knowledge base improvements

The tool does NOT perform the automation itself — it helps **identify, prioritise, track, and communicate** automation work.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router, TypeScript)
- **Database:** Supabase (PostgreSQL + RLS)
- **Styling:** Tailwind CSS + custom glassmorphic CSS
- **Email:** Resend (optional)
- **Deployment:** Vercel

---

## Visibility Control (Private Mode)

The system includes a lightweight visibility layer that allows the operator to prepare work privately before revealing it to management or public-facing surfaces.

### Model

Every `execution_pipeline` item and `feed_items` entry has a `visibility` field with two values:

| Value | Meaning |
|-------|---------|
| `private` | Visible only in admin/operator views. Hidden from homepage, `/updates` feed, and any public-facing surface. |
| `public` | Visible everywhere — including the homepage "Recent Fixes", `/updates` feed, and management-facing dashboards. |

**Default:** `private` — all new pipeline items and feed entries start as private for safety.

### What respects visibility

| Surface | Behaviour |
|---------|-----------|
| Homepage recent fixes (`/`) | Shows only `public` feed items |
| Updates feed (`/updates`) | Shows only `public` feed items |
| Admin pipeline (`/admin/pipeline`) | Shows **all** items with visibility badge |
| Admin dashboard (`/admin/dashboard`) | Shows all items + public/private breakdown |
| Pipeline create/edit forms | Include visibility selector |
| Publish-to-feed form (`/admin/[id]`) | Includes visibility selector |
| Dashboard API (`/api/admin/dashboard`) | Returns both total and public-only stats |

### Schema changes

| Table | Column | Type | Default |
|-------|--------|------|---------|
| `execution_pipeline` | `visibility` | `visibility` enum (`'private'`, `'public'`) | `'private'` |
| `feed_items` | `visibility` | `visibility` enum (`'private'`, `'public'`) | `'private'` |

The `public_feed` database view is updated to filter `WHERE visibility = 'public'`.

Migration: [`schema/003_visibility.sql`](./schema/003_visibility.sql)

### Purpose

This is **not** a permissions system or RBAC. It is a simple internal visibility layer so the AI & Automation Lead can:

- Create and track pipeline work privately before it's ready to share
- Publish feed items as private drafts before revealing them to the company
- Selectively reveal items to management/public views when ready

---

## Future Direction

- AI auto-categorisation of submissions
- Management report export (PDF/CSV)
- Trend analysis and charts over time
- Knowledge base integration
- Submission notifications to employees when their issue is fixed
- Theme clustering of related submissions
- Integration with project management tools
