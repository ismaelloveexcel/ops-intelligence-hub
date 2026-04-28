# Copilot Instructions — Ops Intelligence Hub

## What this is
Internal Operations Intelligence Portal for ARIE Finance — a Mauritius-based financial services startup. The operator is the AI & Automation Lead and uses this repo to capture operational friction, prioritise automation opportunities, track execution, and prepare management reporting.

## Stack
- Next.js App Router with TypeScript
- Tailwind CSS
- Supabase PostgreSQL, RLS, service role operations, and SQL migrations
- Optional Resend email notifications
- Vercel deployment

## Operating Principles
- The operator is a solo non-technical builder. Prioritise simple, production-safe, maintainable changes.
- Reliability, privacy, admin protection, auditability, and management reporting clarity matter more than clever implementation.
- Keep PRs small and reviewable.
- Prefer existing patterns over new architecture.
- Do not introduce paid services, new infrastructure, or complex abstractions unless explicitly required.

## Security Rules
- This handles sensitive financial and operational data. Security is non-negotiable.
- Never expose API keys, service-role keys, admin secrets, cookies, or private environment values.
- Never log sensitive client, financial, employee, or operational data to the console.
- Preserve admin login, middleware protection, API protection, audit logging, validation, and RLS assumptions.
- Always consider RLS policies when a table, view, or data access path changes.
- Prefer server-side data fetching for private/admin data.
- Sanitize AI prompt inputs before sending anything to an AI provider.

## AI Agent Rules
- Inspect the repo before editing.
- Follow existing Next.js, TypeScript, Supabase, and Tailwind patterns.
- Do not rewrite unrelated files.
- Do not create fake integrations or placeholder-only features.
- If a requirement is ambiguous, make the safest practical assumption and document it in the PR.
- For dashboards/reports, include both data-source logic and UI verification notes.
- For automation suggestions, clearly separate implemented code from future recommendations.

## PR Requirements
Every PR must include:
1. Summary of changes
2. Files changed
3. Tests/checks run
4. Setup required, if any
5. Risks or limitations
6. Manual verification steps

## Definition of Done
A task is not done until the PR is merged, checks pass, deployment is ready, and the main user flow has been manually tested.