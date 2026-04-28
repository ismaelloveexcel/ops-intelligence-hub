# Copilot Instructions — Ops Intelligence Hub

## What this is
Internal Operations Intelligence Portal for Arie Finance — a Mauritius-based financial services startup.
I am the AI & Automation Lead. This tool connects our operations data and surfaces AI-driven insights.

## Stack
- Next.js App Router (TypeScript), Tailwind CSS
- Supabase (PostgreSQL + RLS + Edge Functions)
- Anthropic Claude API for AI analysis
- Vercel deployment

## Rules for this codebase
- This handles sensitive financial and operational data — security is non-negotiable
- Always use Supabase RLS on every table — never expose data without a policy
- Never log sensitive data (client names, financial figures) to console
- All AI prompts must sanitise inputs before sending to Claude API
- Prefer server-side data fetching — minimal exposure on the client

## What Copilot should do
- Suggest automation when you see a manual, repetitive pattern
- Flag any potential data exposure risks immediately
- When I describe a report or dashboard, suggest the SQL query + the UI together
- Remind me to add RLS policies whenever a new table is created
- Suggest Edge Functions for anything that should run on a schedule
