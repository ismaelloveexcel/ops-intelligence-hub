import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminRequest } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authErr = await validateAdminRequest(req)
  if (authErr) return authErr

  try {
    const [
      totalRes,
      byStatus,
      byDept,
      byType,
      feedRes,
      pipelineRes,
      boardRes,
    ] = await Promise.all([
      supabaseAdmin.from('submissions').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('submissions').select('status'),
      supabaseAdmin.from('submissions').select('department'),
      supabaseAdmin.from('submissions').select('submission_type'),
      supabaseAdmin.from('feed_items').select('hours_saved'),
      supabaseAdmin.from('execution_pipeline').select('status, actual_hours_saved'),
      supabaseAdmin.from('admin_board').select('id, hours_wasted_month, priority_score, status, department, description, automation_potential, implementation_effort, review_category, frustration_level'),
    ])

    // Total
    const total = totalRes.count ?? 0

    // Status breakdown
    const statusCounts: Record<string, number> = {}
    for (const r of byStatus.data ?? []) {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1
    }

    // Department breakdown
    const deptCounts: Record<string, number> = {}
    for (const r of byDept.data ?? []) {
      deptCounts[r.department] = (deptCounts[r.department] || 0) + 1
    }

    // Type breakdown
    const typeCounts: Record<string, number> = {}
    for (const r of byType.data ?? []) {
      typeCounts[r.submission_type] = (typeCounts[r.submission_type] || 0) + 1
    }

    // Hours saved from feed
    const hoursSavedFeed = (feedRes.data ?? []).reduce(
      (sum: number, r: { hours_saved: number | null }) => sum + (r.hours_saved ?? 0), 0
    )

    // Pipeline stats
    const pipelineData = pipelineRes.data ?? []
    const deploymentsCount = pipelineData.filter(
      (r: { status: string }) => r.status === 'deployed'
    ).length
    const hoursSavedPipeline = pipelineData.reduce(
      (sum: number, r: { actual_hours_saved: number | null }) => sum + (r.actual_hours_saved ?? 0), 0
    )

    // Hours wasted from board
    const boardData = boardRes.data ?? []
    const totalHoursWasted = boardData.reduce(
      (sum: number, r: { hours_wasted_month: number | null }) => sum + (r.hours_wasted_month ?? 0), 0
    )

    // Top bottlenecks (highest hours_wasted_month, exclude implemented/rejected)
    const activeItems = boardData.filter(
      (r: { status: string }) => !['implemented', 'rejected'].includes(r.status)
    )
    const topBottlenecks = [...activeItems]
      .sort((a: { hours_wasted_month: number | null }, b: { hours_wasted_month: number | null }) =>
        (b.hours_wasted_month ?? 0) - (a.hours_wasted_month ?? 0))
      .slice(0, 5)

    // Quick wins (high automation potential + quick effort, not implemented)
    const quickWins = activeItems
      .filter((r: { automation_potential: number | null; implementation_effort: string | null }) =>
        (r.automation_potential ?? 0) >= 4 && r.implementation_effort === 'quick')
      .slice(0, 5)

    return NextResponse.json({
      total,
      statusCounts,
      deptCounts,
      typeCounts,
      totalHoursWasted: Math.round(totalHoursWasted * 100) / 100,
      totalHoursSaved: Math.round((hoursSavedFeed + hoursSavedPipeline) * 100) / 100,
      deploymentsCount,
      topBottlenecks,
      quickWins,
    })
  } catch (err) {
    console.error('[GET /api/admin/dashboard]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
