# Ops Intelligence Hub

> **Internal operating system for the AI & Automation Lead at ARIE Finance.**
> This is NOT a public SaaS product. It is a focused internal tool designed to help the AI & Automation Lead integrate into the company quickly, identify operational bottlenecks, capture employee suggestions, prioritise automation opportunities, track execution, and prove impact.

---

## What This Is

Ops Intelligence Hub is the central control panel for:

- **Employee suggestions** — anyone in the company can report a problem, suggest an improvement, or share a quick idea
- **Operational pain points** — structured capture of what's slow, manual, or error-prone
- **Automation prioritisation** — scoring system that surfaces the biggest bottlenecks and easiest quick wins
- **Execution tracking** — pipeline view of what's being built and deployed
- **Impact measurement** — hours wasted vs hours saved, before/after comparisons
- **"You Said / We Fixed" feed** — visible proof that employee input leads to real change

The goal: **look effective early, move fast, show results.**

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
Employee-facing form branded as **"Improve Our Work"**. Supports three types:
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
- Status breakdown, department breakdown
- **Top bottlenecks** (highest hours wasted, excluding completed)
- **Quick wins** (high automation potential + quick effort)

### 5. Public Feed (`/updates`)
"You Said → We Fixed" with:
- Hours saved badges
- Before vs after summaries
- Monthly grouping

---

## Workflow Loop

```
Employee submits → Admin reviews & scores → Priority list generated →
Build/deploy tracked in pipeline → Published to "You Said / We Fixed" →
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

Full schema: [`schema/001_initial.sql`](./schema/001_initial.sql)

| Table | Purpose |
|-------|---------|
| `submissions` | Employee submissions with structured fields |
| `review_actions` | Admin review scoring (1:1 with submissions) |
| `feed_items` | Published "You Said / We Fixed" entries |
| `execution_pipeline` | Delivery tracking items |

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
| `/updates` | Public | Full "You Said / We Fixed" feed |
| `/admin` | Admin | Triage board — all submissions |
| `/admin/[id]` | Admin | Review + score + publish |
| `/admin/dashboard` | Admin | Analytics dashboard |
| `/admin/pipeline` | Admin | Execution pipeline tracker |
| `/admin/pipeline/new` | Admin | Create pipeline item |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/submissions` | Create submission (rate-limited) |
| `GET` | `/api/admin/submissions/[id]` | Fetch admin board row |
| `PATCH` | `/api/admin/submissions/[id]` | Upsert review + update status |
| `POST` | `/api/admin/submissions/[id]/publish` | Publish to feed |
| `GET` | `/api/admin/dashboard` | Dashboard metrics |
| `GET/POST` | `/api/admin/pipeline` | List/create pipeline items |
| `PATCH/DELETE` | `/api/admin/pipeline/[id]` | Update/delete pipeline item |

---

## Security

| Feature | Implementation |
|---------|---------------|
| **No unsafe fallback** | `supabaseAdmin` throws if `SUPABASE_SERVICE_ROLE_KEY` is missing — never silently falls back to anon key |
| **Admin route protection** | `validateAdminRequest()` middleware on all `/api/admin/*` routes |
| **Rate limiting** | 10 submissions per 15 minutes per IP on the public endpoint |
| **Input validation** | All API routes validate types, ranges, and required fields |
| **Lazy client init** | Both Supabase clients use `Proxy` to avoid build-time crashes |
| **RLS enabled** | Row-level security on all tables in the schema |

> **Note:** For production, add proper auth (Supabase Auth, NextAuth, or Vercel Password Protection for admin routes). The current `ADMIN_API_SECRET` header check is a pragmatic first layer for internal use.

---

## Setup

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/ops-intelligence-hub.git
cd ops-intelligence-hub
npm install
```

### 2. Supabase
Create a project at [supabase.com](https://supabase.com). Run [`schema/001_initial.sql`](./schema/001_initial.sql) in the SQL editor.

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

## Future Direction

- AI auto-categorisation of submissions
- Management report export (PDF/CSV)
- Trend analysis and charts over time
- Knowledge base integration
- Submission notifications to employees when their issue is fixed
- Theme clustering of related submissions
- Integration with project management tools
