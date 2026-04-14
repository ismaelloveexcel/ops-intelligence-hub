# Operations Intelligence Hub

An internal portal for surfacing, triaging, and resolving operational pain points across the team. Employees submit issues anonymously or by name; the admin reviews, acts, and publishes fixes to a public "You Said / We Fixed" feed.

---

## Setup (5 steps)

| Step | Action |
|------|--------|
| **1. Supabase** | Create a project at [supabase.com](https://supabase.com). Run the full SQL schema from the prompt (schema includes tables, views, and seed data). |
| **2. Clone** | `git clone https://github.com/YOUR_USERNAME/ops-intelligence-hub.git && cd ops-intelligence-hub` |
| **3. Install** | `npm install` |
| **4. Environment** | Copy `.env.local.example` → `.env.local` and fill in all values (Supabase keys, Resend API key, admin email). |
| **5. Deploy** | Push to GitHub → connect repo in [Vercel](https://vercel.com) → add all env vars in Vercel project settings → deploy. |

---

## Routes

| Route | Visibility | Description |
|-------|-----------|-------------|
| `/` | Public | Homepage — stats + recent "You Said / We Fixed" feed |
| `/submit` | Public | Employee submission form (anonymous toggle) |
| `/submit/done` | Public | Confirmation screen after submission |
| `/updates` | Public | Full public feed of all published fixes |
| `/admin` | Admin only | Triage board — all submissions with status counts |
| `/admin/[id]` | Admin only | Single submission review + publish to feed |

> **Admin access:** Protect `/admin` via **Vercel Password Protection** — Project Settings → Security → Password Protection. No login system is built into Phase 1.

---

## Weekly Routine (15 min every Monday)

1. Open `/admin` — review all **New** submissions (left teal border).
2. Set action type, priority, ease, owner, and target date for each.
3. Update status to `Reviewing` or `Accepted`.
4. For completed fixes → open `/admin/[id]` → fill publish fields → click **Publish to Feed**.
5. Done. Employees see updates at `/updates`.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/submissions` | Create new submission, fire admin email |
| `GET` | `/api/admin/submissions/[id]` | Fetch full admin_board row |
| `PATCH` | `/api/admin/submissions/[id]` | Upsert review action + update status |
| `POST` | `/api/admin/submissions/[id]/publish` | Publish to feed, mark implemented |

---

## Phase 2 Additions (not built)

- **AI auto-categorisation** — auto-assign action type and priority on submission
- **Knowledge base** — searchable internal documentation linked to fixes
- **Management dashboard** — trend charts, department breakdowns, ROI tracking
- **Theme grouping** — cluster related submissions by topic automatically
- **Submission notifications** — email employees when their issue is fixed

---

## Tech Stack

- **Framework:** Next.js 14 (App Router, TypeScript strict mode)
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS + custom glassmorphic CSS
- **Email:** Resend
- **Deployment:** Vercel
