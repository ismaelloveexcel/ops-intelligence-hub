import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminRequest } from '@/lib/admin-auth'
import { KpiArea, KPI_AREAS } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export async function GET(req: NextRequest) {
  const authErr = await validateAdminRequest(req)
  if (authErr) return authErr

  try {
    const { searchParams } = new URL(req.url)
    const reportRunId = searchParams.get('reportRunId')

    // Try to use a specific report_run if provided
    let narrativeMd: string | null = null
    let rangeLabel = 'Last 30 days'

    if (reportRunId) {
      const { data: run } = await supabaseAdmin
        .from('report_runs')
        .select('narrative_md, range_label')
        .eq('id', reportRunId)
        .single()
      if (run) {
        narrativeMd = run.narrative_md
        rangeLabel = run.range_label ?? rangeLabel
      }
    } else {
      // Use latest draft report run
      const { data: latestRun } = await supabaseAdmin
        .from('report_runs')
        .select('narrative_md, range_label')
        .eq('status', 'draft')
        .order('generated_at', { ascending: false })
        .limit(1)
        .single()
      if (latestRun) {
        narrativeMd = latestRun.narrative_md
        rangeLabel = latestRun.range_label ?? rangeLabel
      }
    }

    const now = new Date()
    const sinceDate = new Date(now.getTime() - 30 * 86400000).toISOString()

    // Fetch data for PDF
    const [feedRes, pipelineRes, submissionsRes, boardRes] = await Promise.all([
      supabaseAdmin
        .from('feed_items')
        .select('*')
        .gte('published_at', sinceDate)
        .order('published_at', { ascending: false }),
      supabaseAdmin
        .from('execution_pipeline')
        .select('*')
        .gte('created_at', sinceDate),
      supabaseAdmin
        .from('submissions')
        .select('id, status, affects_client, involves_money, ai_urgency_score, created_at, description, department')
        .gte('created_at', sinceDate),
      supabaseAdmin
        .from('admin_board')
        .select('ai_kpi_area, status, hours_wasted_month')
        .gte('created_at', sinceDate),
    ])

    const feed = feedRes.data ?? []
    const pipeline = pipelineRes.data ?? []
    const submissions = submissionsRes.data ?? []
    const board = boardRes.data ?? []

    // ── Compute metrics ──────────────────────────────────────────────────────

    const totalHoursSaved =
      feed.reduce((s: number, f: { hours_saved: number | null }) => s + (f.hours_saved ?? 0), 0) +
      pipeline.reduce((s: number, p: { actual_hours_saved: number | null }) => s + (p.actual_hours_saved ?? 0), 0)

    const deployedCount = pipeline.filter((p: { status: string }) => p.status === 'deployed').length
    const automationCount = pipeline.filter((p: { solution_category: string | null }) => p.solution_category === 'automation').length
    const automationRate = deployedCount > 0 ? (automationCount / deployedCount) * 100 : 0

    const openHighUrgency = submissions.filter(
      (s: { status: string; affects_client: boolean; involves_money: boolean; ai_urgency_score: number | null }) =>
        ['new', 'reviewing'].includes(s.status) &&
        (s.affects_client && s.involves_money || (s.ai_urgency_score ?? 0) >= 8)
    ).length

    // KPI tiles (all 9 KPIs)
    const kpiMap: Record<string, { open: number; resolved: number; hoursSaved: number }> = {}
    for (const kpi of KPI_AREAS) kpiMap[kpi] = { open: 0, resolved: 0, hoursSaved: 0 }
    for (const row of board) {
      const kpi = (row.ai_kpi_area as string) || 'general_ops'
      if (!kpiMap[kpi]) continue
      if (['new', 'reviewing', 'accepted'].includes(row.status as string)) kpiMap[kpi].open++
      else kpiMap[kpi].resolved++
    }
    for (const f of feed) {
      const kpi = (f.kpi_area as string) || 'general_ops'
      if (!kpiMap[kpi]) continue
      kpiMap[kpi].hoursSaved += (f.hours_saved as number | null) ?? 0
    }
    const kpiTiles = KPI_AREAS.map((kpi) => ({
      kpi: kpi as KpiArea,
      ...kpiMap[kpi],
    }))

    // Top wins
    const topWins = [...feed]
      .sort((a, b) => ((b.hours_saved as number | null) ?? 0) - ((a.hours_saved as number | null) ?? 0))
      .slice(0, 3)
      .map((f) => ({
        title: f.title as string,
        department: f.department as string,
        hoursSaved: f.hours_saved as number | null,
        before: f.before_summary as string | null,
        after: f.after_summary as string | null,
        shoutout: f.shoutout as string | null,
        whatChanged: f.what_changed as string,
      }))

    // Top risks
    const msPerDay = 86400000
    const topRisks = submissions
      .filter((s: { status: string; affects_client: boolean; involves_money: boolean; ai_urgency_score: number | null }) =>
        ['new', 'reviewing'].includes(s.status) &&
        (s.affects_client || s.involves_money || (s.ai_urgency_score ?? 0) >= 7)
      )
      .slice(0, 3)
      .map((s: { description: string; department: string; ai_urgency_score: number | null; created_at: string; affects_client: boolean; involves_money: boolean }) => ({
        description: s.description,
        department: s.department,
        daysOpen: Math.floor((now.getTime() - new Date(s.created_at).getTime()) / msPerDay),
        urgency: s.ai_urgency_score,
        affectsClient: s.affects_client,
        involvesMoney: s.involves_money,
      }))

    // In progress
    const inProgress = pipeline
      .filter((p: { status: string }) => ['in_progress', 'testing', 'planned'].includes(p.status))
      .slice(0, 6)
      .map((p: { title: string; status: string; tool_used: string | null }) => ({
        title: p.title,
        status: p.status,
        toolUsed: p.tool_used,
      }))

    const pdfData = {
      weekNumber: getWeekNumber(now),
      year: now.getFullYear(),
      rangeLabel,
      generatedAt: now.toISOString(),
      narrativeMd,
      execSummary: 'Operations summary for the period.',
      roiMetrics: {
        totalHoursSaved,
        hoursThisMonth: totalHoursSaved,
        automationRate,
        openHighUrgency,
      },
      kpiTiles,
      topWins,
      topRisks,
      inProgress,
      kpiBreakdown: [],
    }

    // ── Render PDF ───────────────────────────────────────────────────────────
    const { renderToBuffer } = await import('@react-pdf/renderer')
    const React = await import('react')
    const { ReportPDF } = await import('@/lib/pdf/report-template')

    const pdfBuffer = await renderToBuffer(
      React.default.createElement(ReportPDF, { data: pdfData })
    )

    const filename = `arie-ops-report-week${pdfData.weekNumber}-${pdfData.year}.pdf`

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[GET /api/admin/pdf]', err)
    return NextResponse.json({ error: 'Failed to generate PDF.' }, { status: 500 })
  }
}
