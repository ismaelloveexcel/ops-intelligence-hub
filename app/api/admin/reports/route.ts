import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminRequest } from '@/lib/admin-auth'
import { generateAIReport, ReportData } from '@/lib/ai/reports'

export const dynamic = 'force-dynamic'

const ALLOWED_RANGE_DAYS: Record<string, number> = {
  '7': 7,
  '30': 30,
  '90': 90,
}

const DEFAULT_RANGE_DAYS = 30
const MAX_CUSTOM_RANGE_DAYS = 90
const MS_PER_DAY = 86400000
const DESC_MAX_LEN = 80
const DESC_TRUNCATE_AT = 77
const DESC_SHORT_MAX = 70
const DESC_SHORT_TRUNCATE = 67

function parseReportWindow(
  range: string | null,
  customFrom: string | null,
  customTo: string | null
): { sinceDate: string; untilDate: string; label: string } | { error: string } {
  const now = new Date()
  const normalizedRange = range || String(DEFAULT_RANGE_DAYS)

  if (normalizedRange === 'custom') {
    if (!customFrom || !customTo) {
      return { error: 'Both "from" and "to" query parameters are required when range=custom.' }
    }
    const fromDate = new Date(customFrom)
    const toDate = new Date(customTo + 'T23:59:59Z')
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return { error: 'Invalid "from" or "to" date.' }
    }
    if (fromDate > toDate) {
      return { error: '"from" date must be before "to" date.' }
    }
    const spanMs = toDate.getTime() - fromDate.getTime()
    if (spanMs > MAX_CUSTOM_RANGE_DAYS * MS_PER_DAY) {
      return { error: `Custom range cannot exceed ${MAX_CUSTOM_RANGE_DAYS} days.` }
    }
    return {
      sinceDate: fromDate.toISOString(),
      untilDate: toDate.toISOString(),
      label: `${customFrom} to ${customTo}`,
    }
  }

  const days = ALLOWED_RANGE_DAYS[normalizedRange] ?? DEFAULT_RANGE_DAYS
  return {
    sinceDate: new Date(now.getTime() - days * MS_PER_DAY).toISOString(),
    untilDate: now.toISOString(),
    label: `Last ${days} days`,
  }
}

export async function GET(req: NextRequest) {
  const authErr = await validateAdminRequest(req)
  if (authErr) return authErr

  const { searchParams } = new URL(req.url)
  const range = searchParams.get('range')
  const customFrom = searchParams.get('from')
  const customTo = searchParams.get('to')

  const window = parseReportWindow(range, customFrom, customTo)
  if ('error' in window) {
    return NextResponse.json({ error: window.error }, { status: 400 })
  }

  const { sinceDate, untilDate, label } = window

  try {
    const [submissionsRes, boardRes, feedRes, pipelineRes] = await Promise.all([
      supabaseAdmin
        .from('submissions')
        .select('id, created_at, department, description, status, submission_type, process_name, frustration_level, affects_client, involves_money, ai_urgency_score')
        .gte('created_at', sinceDate)
        .lte('created_at', untilDate),
      supabaseAdmin
        .from('admin_board')
        .select('id, created_at, department, description, status, hours_wasted_month, priority_score, automation_potential, implementation_effort, review_category, frustration_level, process_name, ai_kpi_area')
        .gte('created_at', sinceDate)
        .lte('created_at', untilDate),
      supabaseAdmin
        .from('feed_items')
        .select('id, title, what_changed, department, published_at, hours_saved, before_summary, after_summary, shoutout, kpi_area')
        .in('visibility', ['internal', 'public'])
        .gte('published_at', sinceDate)
        .lte('published_at', untilDate),
      supabaseAdmin
        .from('execution_pipeline')
        .select('id, title, status, tool_used, actual_hours_saved, created_at, kpi_area, solution_category')
        .in('visibility', ['internal', 'public'])
        .gte('created_at', sinceDate)
        .lte('created_at', untilDate),
    ])

    const queryErrors = [
      { source: 'submissions', error: submissionsRes.error },
      { source: 'admin_board', error: boardRes.error },
      { source: 'feed_items', error: feedRes.error },
      { source: 'execution_pipeline', error: pipelineRes.error },
    ].filter(({ error }) => error)

    if (queryErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Failed to load report data',
          details: queryErrors.map(({ source, error }) => ({
            source,
            message: error?.message ?? 'Unknown Supabase error',
          })),
        },
        { status: 500 }
      )
    }

    const submissions = submissionsRes.data ?? []
    const board = boardRes.data ?? []
    const feed = feedRes.data ?? []
    const pipeline = pipelineRes.data ?? []

    // ── Compute metrics ──────────────────────────────────────────────────────

    const totalHoursSaved =
      feed.reduce((sum: number, r: { hours_saved: number | null }) => sum + (r.hours_saved ?? 0), 0) +
      pipeline.reduce((sum: number, r: { actual_hours_saved: number | null }) => sum + (r.actual_hours_saved ?? 0), 0)

    const deployedCount = pipeline.filter((p: { status: string }) => p.status === 'deployed').length
    const automationCount = pipeline.filter((p: { solution_category: string | null }) => p.solution_category === 'automation').length
    const automationRate = deployedCount > 0 ? (automationCount / deployedCount) * 100 : 0

    const resolvedThisMonth = submissions.filter((s: { status: string }) =>
      ['accepted', 'in_progress', 'implemented'].includes(s.status)
    ).length

    // Department breakdown
    const deptCounts: Record<string, number> = {}
    for (const s of submissions) {
      const dept = s.department as string
      deptCounts[dept] = (deptCounts[dept] || 0) + 1
    }
    const deptBreakdown = Object.entries(deptCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([department, count]) => ({ department, count }))

    // KPI breakdown
    const kpiMap: Record<string, { open: number; resolved: number; hours_saved: number }> = {}
    for (const s of board) {
      const kpi = (s.ai_kpi_area as string) || 'general_ops'
      if (!kpiMap[kpi]) kpiMap[kpi] = { open: 0, resolved: 0, hours_saved: 0 }
      if (['new', 'reviewing', 'accepted'].includes(s.status as string)) kpiMap[kpi].open++
      else kpiMap[kpi].resolved++
    }
    for (const f of feed) {
      const kpi = (f.kpi_area as string) || 'general_ops'
      if (!kpiMap[kpi]) kpiMap[kpi] = { open: 0, resolved: 0, hours_saved: 0 }
      kpiMap[kpi].hours_saved += (f.hours_saved as number | null) ?? 0
    }
    const kpiBreakdown = Object.entries(kpiMap).map(([kpi_area, v]) => ({ kpi_area, ...v }))

    // Top wins
    const topWins = [...feed]
      .sort((a, b) => ((b.hours_saved as number | null) ?? 0) - ((a.hours_saved as number | null) ?? 0))
      .slice(0, 3)
      .map((f) => ({
        title: f.title as string,
        what_changed: f.what_changed as string,
        department: f.department as string,
        hours_saved: f.hours_saved as number | null,
        before_summary: f.before_summary as string | null,
        after_summary: f.after_summary as string | null,
        shoutout: f.shoutout as string | null,
      }))

    // Top risks: unresolved, high urgency or client/money flags
    const now = new Date()
    const topRisks = submissions
      .filter((s: { status: string; affects_client: boolean; involves_money: boolean; ai_urgency_score: number | null }) =>
        ['new', 'reviewing'].includes(s.status) && (s.affects_client || s.involves_money || (s.ai_urgency_score ?? 0) >= 7)
      )
      .slice(0, 3)
      .map((s: { description: string; department: string; ai_urgency_score: number | null; created_at: string; affects_client: boolean; involves_money: boolean }) => ({
        description: s.description,
        department: s.department,
        ai_urgency_score: s.ai_urgency_score,
        days_open: Math.floor((now.getTime() - new Date(s.created_at).getTime()) / MS_PER_DAY),
        affects_client: s.affects_client,
        involves_money: s.involves_money,
      }))

    // In progress
    const inProgress = pipeline
      .filter((p: { status: string }) => ['in_progress', 'testing', 'planned'].includes(p.status))
      .slice(0, 5)
      .map((p: { title: string; status: string; tool_used: string | null }) => ({
        title: p.title,
        status: p.status,
        tool_used: p.tool_used,
      }))

    const reportData: ReportData = {
      totalSubmissions: submissions.length,
      newSubmissions: submissions.filter((s: { status: string }) => s.status === 'new').length,
      resolvedThisMonth,
      totalHoursSaved,
      automationRate,
      deptBreakdown,
      kpiBreakdown,
      topWins,
      topRisks,
      inProgress,
      rangeLabel: label,
    }

    // ── Generate AI narrative (with ASCII fallback) ──────────────────────────
    const aiNarrative = await generateAIReport(reportData)
    const weeklySnapshot = generateWeeklySnapshot(submissions, board, feed, pipeline)
    const automationSummary = generateAutomationSummary(board, pipeline)
    const leadershipUpdate = generateLeadershipUpdate(submissions, board, feed, pipeline)

    // ── Save report run ──────────────────────────────────────────────────────
    let reportRunId: string | null = null
    const { data: reportRun } = await supabaseAdmin
      .from('report_runs')
      .insert({
        range_label: label,
        kpi_summary: kpiBreakdown as unknown as Record<string, unknown>[],
        narrative_md: aiNarrative,
        status: 'draft',
      })
      .select('id')
      .single()
    if (reportRun) reportRunId = reportRun.id

    return NextResponse.json({
      range: label,
      reportRunId,
      narrativeMd: aiNarrative,
      weeklySnapshot,
      automationSummary,
      leadershipUpdate,
      metrics: {
        totalSubmissions: reportData.totalSubmissions,
        resolvedThisMonth: reportData.resolvedThisMonth,
        totalHoursSaved,
        automationRate,
      },
    })
  } catch (err) {
    console.error('[GET /api/admin/reports]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

// ─── ASCII Fallback Generators ────────────────────────────────────────────────

function generateWeeklySnapshot(
  submissions: unknown[],
  board: unknown[],
  feed: unknown[],
  pipeline: unknown[]
): string {
  const subs = submissions as Array<{ department: string; frustration_level: number | null; status: string; description: string }>
  const b = board as Array<{ hours_wasted_month: number | null; priority_score: number | null; description: string; status: string }>
  const f = feed as Array<{ title: string; hours_saved: number | null }>
  const p = pipeline as Array<{ status: string; title: string; actual_hours_saved: number | null }>

  const totalHoursWasted = b.reduce((sum, r) => sum + (r.hours_wasted_month ?? 0), 0)
  const highFrustration = subs.filter((s) => (s.frustration_level ?? 0) >= 4)
  const totalHoursSaved =
    f.reduce((sum, r) => sum + (r.hours_saved ?? 0), 0) +
    p.reduce((sum, r) => sum + (r.actual_hours_saved ?? 0), 0)
  const deployed = p.filter((r) => r.status === 'deployed').length
  const deptCounts: Record<string, number> = {}
  for (const s of subs) deptCounts[s.department] = (deptCounts[s.department] || 0) + 1
  const topDepts = Object.entries(deptCounts).sort(([, a], [, b]) => b - a).slice(0, 3)

  const lines: string[] = []
  lines.push('WEEKLY OPERATIONS SNAPSHOT')
  lines.push('─'.repeat(40))
  lines.push('')
  lines.push('KEY METRICS')
  lines.push(`  • ${subs.length} submission${subs.length !== 1 ? 's' : ''} received`)
  if (topDepts.length > 0) lines.push(`  • Top departments: ${topDepts.map(([d, c]) => `${d} (${c})`).join(', ')}`)
  if (highFrustration.length > 0) lines.push(`  • ${highFrustration.length} high-frustration items`)
  lines.push('')
  lines.push('BOTTLENECKS')
  if (totalHoursWasted > 0) lines.push(`  • ${totalHoursWasted.toFixed(1)}h/month wasted across reported issues`)
  const topBottlenecks = [...b].sort((a, r) => (r.hours_wasted_month ?? 0) - (a.hours_wasted_month ?? 0)).slice(0, 3)
  for (const bb of topBottlenecks) {
    const desc = bb.description.length > DESC_MAX_LEN ? bb.description.slice(0, DESC_TRUNCATE_AT) + '…' : bb.description
    lines.push(`  • ${desc} — ${(bb.hours_wasted_month ?? 0).toFixed(1)}h/mo`)
  }
  lines.push('')
  lines.push('ACTIONS COMPLETED')
  lines.push(`  • ${f.length} fix${f.length !== 1 ? 'es' : ''} published, ${deployed} deployed`)
  for (const fi of f.slice(0, 3)) lines.push(`    → ${fi.title}`)
  lines.push('')
  lines.push('IMPACT')
  lines.push(`  • ${totalHoursSaved.toFixed(1)}h saved this period`)
  lines.push('')
  lines.push('NEXT PRIORITIES')
  const pending = b.filter((r) => ['new', 'reviewing'].includes(r.status)).sort((a, r) => (r.priority_score ?? 0) - (a.priority_score ?? 0)).slice(0, 3)
  for (const pp of pending) {
    const desc = pp.description.length > DESC_MAX_LEN ? pp.description.slice(0, DESC_TRUNCATE_AT) + '…' : pp.description
    lines.push(`  • ${desc}`)
  }
  return lines.join('\n')
}

function generateAutomationSummary(board: unknown[], pipeline: unknown[]): string {
  const b = board as Array<{ review_category: string | null; automation_potential: number | null; description: string; hours_wasted_month: number | null; implementation_effort: string | null }>
  const p = pipeline as Array<{ status: string; title: string; tool_used: string | null; actual_hours_saved: number | null }>

  const automationCandidates = b.filter((r) => r.review_category === 'automation')
  const quickWins = b.filter((r) => (r.automation_potential ?? 0) >= 4 && r.implementation_effort === 'quick')
  const totalPipelineHours = p.reduce((sum, r) => sum + (r.actual_hours_saved ?? 0), 0)
  const deployed = p.filter((r) => r.status === 'deployed')
  const active = p.filter((r) => ['in_progress', 'testing'].includes(r.status))

  const lines: string[] = []
  lines.push('AUTOMATION PIPELINE SUMMARY')
  lines.push('─'.repeat(40))
  lines.push('')
  lines.push(`  • ${automationCandidates.length} automation opportunities`)
  lines.push(`  • ${quickWins.length} quick wins`)
  lines.push(`  • ${deployed.length} deployed, ${active.length} active`)
  lines.push(`  • ${totalPipelineHours.toFixed(1)}h saved from deployed automations`)
  return lines.join('\n')
}

function generateLeadershipUpdate(
  submissions: unknown[],
  board: unknown[],
  feed: unknown[],
  pipeline: unknown[]
): string {
  const subs = submissions as Array<{ department: string; status: string }>
  const f = feed as Array<{ title: string; hours_saved: number | null }>
  const p = pipeline as Array<{ status: string; actual_hours_saved: number | null }>
  const b = board as Array<{ priority_score: number | null; description: string; status: string; process_name: string | null }>

  const totalHoursSaved =
    f.reduce((sum, r) => sum + (r.hours_saved ?? 0), 0) +
    p.reduce((sum, r) => sum + (r.actual_hours_saved ?? 0), 0)
  const deptCounts: Record<string, number> = {}
  for (const s of subs) deptCounts[s.department] = (deptCounts[s.department] || 0) + 1

  const lines: string[] = []
  lines.push('LEADERSHIP UPDATE')
  lines.push('─'.repeat(40))
  lines.push('')
  lines.push(`  • ${subs.length} submissions from ${Object.keys(deptCounts).length} departments`)
  lines.push(`  • ${f.length} improvements completed`)
  lines.push(`  • ${totalHoursSaved.toFixed(1)}h manual work saved`)
  for (const fi of f.slice(0, 3)) lines.push(`    → ${fi.title}`)
  lines.push('')
  lines.push('PRIORITIES')
  const upcoming = b
    .filter((r) => ['accepted', 'new', 'reviewing'].includes(r.status))
    .sort((a, r) => (r.priority_score ?? 0) - (a.priority_score ?? 0))
    .slice(0, 3)
  for (const u of upcoming) {
    const desc = u.description.length > DESC_SHORT_MAX ? u.description.slice(0, DESC_SHORT_TRUNCATE) + '…' : u.description
    lines.push(`  • ${desc}`)
  }
  return lines.join('\n')
}

interface SubmissionRow {
  id: string
  created_at: string
  department: string
  description: string
  status: string
  submission_type: string
  process_name: string | null
  frustration_level: number | null
}

interface BoardRow {
  id: string
  created_at: string
  department: string
  description: string
  status: string
  hours_wasted_month: number | null
  priority_score: number | null
  automation_potential: number | null
  implementation_effort: string | null
  review_category: string | null
  frustration_level: number | null
  process_name: string | null
}

interface FeedRow {
  id: string
  title: string
  what_changed: string
  department: string
  published_at: string
  hours_saved: number | null
}

interface PipelineRow {
  id: string
  title: string
  status: string
  tool_used: string | null
  actual_hours_saved: number | null
  created_at: string
}
