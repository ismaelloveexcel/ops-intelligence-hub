import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminRequest } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

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

export async function GET(req: NextRequest) {
  const authErr = await validateAdminRequest(req)
  if (authErr) return authErr

  const { searchParams } = new URL(req.url)
  const range = searchParams.get('range') || '30'
  const customFrom = searchParams.get('from')
  const customTo = searchParams.get('to')

  let sinceDate: string

  if (range === 'custom' && customFrom) {
    sinceDate = new Date(customFrom).toISOString()
  } else {
    const days = parseInt(range, 10) || 30
    sinceDate = new Date(Date.now() - days * 86400000).toISOString()
  }

  const untilDate = (range === 'custom' && customTo)
    ? new Date(customTo + 'T23:59:59Z').toISOString()
    : new Date().toISOString()

  try {
    const [submissionsRes, boardRes, feedRes, pipelineRes] = await Promise.all([
      supabaseAdmin
        .from('submissions')
        .select('id, created_at, department, description, status, submission_type, process_name, frustration_level')
        .gte('created_at', sinceDate)
        .lte('created_at', untilDate),
      supabaseAdmin
        .from('admin_board')
        .select('id, created_at, department, description, status, hours_wasted_month, priority_score, automation_potential, implementation_effort, review_category, frustration_level, process_name')
        .gte('created_at', sinceDate)
        .lte('created_at', untilDate),
      supabaseAdmin
        .from('feed_items')
        .select('id, title, what_changed, department, published_at, hours_saved')
        .gte('published_at', sinceDate)
        .lte('published_at', untilDate),
      supabaseAdmin
        .from('execution_pipeline')
        .select('id, title, status, tool_used, actual_hours_saved, created_at')
        .gte('created_at', sinceDate)
        .lte('created_at', untilDate),
    ])

    const submissions = (submissionsRes.data ?? []) as SubmissionRow[]
    const board = (boardRes.data ?? []) as BoardRow[]
    const feed = (feedRes.data ?? []) as FeedRow[]
    const pipeline = (pipelineRes.data ?? []) as PipelineRow[]

    // Generate reports
    const weeklySnapshot = generateWeeklySnapshot(submissions, board, feed, pipeline)
    const automationSummary = generateAutomationSummary(board, pipeline)
    const leadershipUpdate = generateLeadershipUpdate(submissions, board, feed, pipeline)

    return NextResponse.json({
      range: range === 'custom' ? `${customFrom} to ${customTo}` : `Last ${range} days`,
      weeklySnapshot,
      automationSummary,
      leadershipUpdate,
    })
  } catch (err) {
    console.error('[GET /api/admin/reports]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

function generateWeeklySnapshot(
  submissions: SubmissionRow[],
  board: BoardRow[],
  feed: FeedRow[],
  pipeline: PipelineRow[]
): string {
  const totalSubmissions = submissions.length
  const deptCounts: Record<string, number> = {}
  for (const s of submissions) {
    deptCounts[s.department] = (deptCounts[s.department] || 0) + 1
  }
  const topDepts = Object.entries(deptCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  const totalHoursWasted = board.reduce((sum, r) => sum + (r.hours_wasted_month ?? 0), 0)
  const highFrustration = submissions.filter(s => (s.frustration_level ?? 0) >= 4)

  const actionsCompleted = feed.length
  const totalHoursSaved = feed.reduce((sum, r) => sum + (r.hours_saved ?? 0), 0)
  const pipelineHoursSaved = pipeline.reduce((sum, r) => sum + (r.actual_hours_saved ?? 0), 0)
  const combinedHoursSaved = totalHoursSaved + pipelineHoursSaved

  const deployed = pipeline.filter(p => p.status === 'deployed').length
  const inProgress = pipeline.filter(p => p.status === 'in_progress').length

  const statusCounts: Record<string, number> = {}
  for (const s of submissions) {
    statusCounts[s.status] = (statusCounts[s.status] || 0) + 1
  }

  const lines: string[] = []
  lines.push('WEEKLY OPERATIONS SNAPSHOT')
  lines.push('═'.repeat(40))
  lines.push('')

  lines.push('1. KEY OBSERVATIONS')
  lines.push(`   • ${totalSubmissions} new submission${totalSubmissions !== 1 ? 's' : ''} received`)
  if (topDepts.length > 0) {
    lines.push(`   • Top departments: ${topDepts.map(([d, c]) => `${d} (${c})`).join(', ')}`)
  }
  if (highFrustration.length > 0) {
    lines.push(`   • ${highFrustration.length} high-frustration item${highFrustration.length !== 1 ? 's' : ''} flagged (level 4–5)`)
  }
  lines.push('')

  lines.push('2. BOTTLENECKS IDENTIFIED')
  if (totalHoursWasted > 0) {
    lines.push(`   • Estimated ${totalHoursWasted.toFixed(1)} hours/month wasted across reported issues`)
  }
  const topBottlenecks = [...board]
    .sort((a, b) => (b.hours_wasted_month ?? 0) - (a.hours_wasted_month ?? 0))
    .slice(0, 3)
  if (topBottlenecks.length > 0) {
    lines.push('   • Top bottlenecks:')
    for (const b of topBottlenecks) {
      const desc = b.description.length > 80 ? b.description.slice(0, 77) + '...' : b.description
      lines.push(`     – ${desc} (${(b.hours_wasted_month ?? 0).toFixed(1)}h/mo)`)
    }
  } else {
    lines.push('   • No bottleneck data available for this period')
  }
  lines.push('')

  lines.push('3. ACTIONS TAKEN')
  lines.push(`   • ${actionsCompleted} fix${actionsCompleted !== 1 ? 'es' : ''} published to the feed`)
  lines.push(`   • ${deployed} pipeline item${deployed !== 1 ? 's' : ''} deployed`)
  if (feed.length > 0) {
    for (const f of feed.slice(0, 3)) {
      lines.push(`     – ${f.title}`)
    }
  }
  lines.push('')

  lines.push('4. AUTOMATIONS IN PROGRESS')
  lines.push(`   • ${inProgress} item${inProgress !== 1 ? 's' : ''} currently in progress`)
  const activePipeline = pipeline.filter(p => ['in_progress', 'testing', 'planned'].includes(p.status))
  if (activePipeline.length > 0) {
    for (const p of activePipeline.slice(0, 3)) {
      lines.push(`     – ${p.title} (${p.status.replace('_', ' ')})`)
    }
  }
  lines.push('')

  lines.push('5. IMPACT')
  lines.push(`   • ${combinedHoursSaved.toFixed(1)} hours saved in this period`)
  if (feed.length > 0) {
    lines.push(`   • ${feed.length} improvement${feed.length !== 1 ? 's' : ''} communicated to employees`)
  }
  lines.push('')

  lines.push('6. NEXT PRIORITIES')
  const pending = board
    .filter(r => ['new', 'reviewing'].includes(r.status))
    .sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0))
    .slice(0, 3)
  if (pending.length > 0) {
    for (const p of pending) {
      const desc = p.description.length > 80 ? p.description.slice(0, 77) + '...' : p.description
      lines.push(`   • ${desc}`)
    }
  } else {
    lines.push('   • All current items are in progress or completed')
  }

  return lines.join('\n')
}

function generateAutomationSummary(
  board: BoardRow[],
  pipeline: PipelineRow[]
): string {
  const automationCandidates = board.filter(r => r.review_category === 'automation')
  const quickWins = board.filter(r => (r.automation_potential ?? 0) >= 4 && r.implementation_effort === 'quick')
  const highPotential = board
    .filter(r => (r.automation_potential ?? 0) >= 3)
    .sort((a, b) => (b.automation_potential ?? 0) - (a.automation_potential ?? 0))

  const pipelineByStatus: Record<string, PipelineRow[]> = {}
  for (const p of pipeline) {
    if (!pipelineByStatus[p.status]) pipelineByStatus[p.status] = []
    pipelineByStatus[p.status].push(p)
  }

  const totalPipelineHours = pipeline.reduce((sum, r) => sum + (r.actual_hours_saved ?? 0), 0)

  const lines: string[] = []
  lines.push('AUTOMATION PIPELINE SUMMARY')
  lines.push('═'.repeat(40))
  lines.push('')

  lines.push('1. KEY OBSERVATIONS')
  lines.push(`   • ${automationCandidates.length} submission${automationCandidates.length !== 1 ? 's' : ''} categorised as automation opportunities`)
  lines.push(`   • ${quickWins.length} quick win${quickWins.length !== 1 ? 's' : ''} identified (high potential + low effort)`)
  lines.push(`   • ${pipeline.length} item${pipeline.length !== 1 ? 's' : ''} in the execution pipeline`)
  lines.push('')

  lines.push('2. BOTTLENECKS IDENTIFIED')
  if (highPotential.length > 0) {
    lines.push('   • High automation potential items:')
    for (const h of highPotential.slice(0, 5)) {
      const desc = h.description.length > 70 ? h.description.slice(0, 67) + '...' : h.description
      lines.push(`     – ${desc} (potential: ${h.automation_potential}/5)`)
    }
  } else {
    lines.push('   • No high-potential automation items identified yet')
  }
  lines.push('')

  lines.push('3. ACTIONS TAKEN')
  const deployed = pipelineByStatus['deployed'] ?? []
  lines.push(`   • ${deployed.length} automation${deployed.length !== 1 ? 's' : ''} deployed`)
  for (const d of deployed.slice(0, 3)) {
    const tool = d.tool_used ? ` (${d.tool_used})` : ''
    lines.push(`     – ${d.title}${tool}`)
  }
  lines.push('')

  lines.push('4. AUTOMATIONS IN PROGRESS')
  const active = [...(pipelineByStatus['in_progress'] ?? []), ...(pipelineByStatus['testing'] ?? [])]
  lines.push(`   • ${active.length} automation${active.length !== 1 ? 's' : ''} being built or tested`)
  for (const a of active.slice(0, 3)) {
    const tool = a.tool_used ? ` using ${a.tool_used}` : ''
    lines.push(`     – ${a.title} (${a.status.replace('_', ' ')})${tool}`)
  }
  lines.push('')

  lines.push('5. IMPACT')
  lines.push(`   • ${totalPipelineHours.toFixed(1)} hours saved from deployed automations`)
  if (quickWins.length > 0) {
    const potentialHours = quickWins.reduce((sum, r) => sum + (r.hours_wasted_month ?? 0), 0)
    lines.push(`   • ${potentialHours.toFixed(1)} hours/month could be recovered from identified quick wins`)
  }
  lines.push('')

  lines.push('6. NEXT PRIORITIES')
  const planned = pipelineByStatus['planned'] ?? []
  if (planned.length > 0) {
    for (const p of planned.slice(0, 3)) {
      lines.push(`   • ${p.title}`)
    }
  }
  if (quickWins.length > 0) {
    lines.push('   • Quick wins to action:')
    for (const q of quickWins.slice(0, 3)) {
      const desc = q.description.length > 70 ? q.description.slice(0, 67) + '...' : q.description
      lines.push(`     – ${desc}`)
    }
  }
  if (planned.length === 0 && quickWins.length === 0) {
    lines.push('   • Review new submissions for automation opportunities')
  }

  return lines.join('\n')
}

function generateLeadershipUpdate(
  submissions: SubmissionRow[],
  board: BoardRow[],
  feed: FeedRow[],
  pipeline: PipelineRow[]
): string {
  const totalSubmissions = submissions.length
  const totalHoursWasted = board.reduce((sum, r) => sum + (r.hours_wasted_month ?? 0), 0)
  const feedHoursSaved = feed.reduce((sum, r) => sum + (r.hours_saved ?? 0), 0)
  const pipelineHoursSaved = pipeline.reduce((sum, r) => sum + (r.actual_hours_saved ?? 0), 0)
  const totalHoursSaved = feedHoursSaved + pipelineHoursSaved
  const deployed = pipeline.filter(p => p.status === 'deployed').length
  const inProgress = pipeline.filter(p => ['in_progress', 'testing'].includes(p.status)).length

  const deptCounts: Record<string, number> = {}
  for (const s of submissions) {
    deptCounts[s.department] = (deptCounts[s.department] || 0) + 1
  }

  const lines: string[] = []
  lines.push('LEADERSHIP UPDATE DRAFT')
  lines.push('═'.repeat(40))
  lines.push('')

  lines.push('1. KEY OBSERVATIONS')
  lines.push(`   • ${totalSubmissions} employee submission${totalSubmissions !== 1 ? 's' : ''} received this period`)
  lines.push(`   • Active engagement from ${Object.keys(deptCounts).length} department${Object.keys(deptCounts).length !== 1 ? 's' : ''}`)
  lines.push(`   • Employee feedback is being used to prioritise operational improvements`)
  lines.push('')

  lines.push('2. BOTTLENECKS IDENTIFIED')
  if (totalHoursWasted > 0) {
    lines.push(`   • ${totalHoursWasted.toFixed(1)} estimated hours/month identified as wasted across submissions`)
  }
  const topIssues = [...board]
    .sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0))
    .slice(0, 3)
  if (topIssues.length > 0) {
    lines.push('   • Highest-priority areas:')
    for (const t of topIssues) {
      const process = t.process_name ? ` (${t.process_name})` : ''
      const desc = t.description.length > 70 ? t.description.slice(0, 67) + '...' : t.description
      lines.push(`     – ${desc}${process}`)
    }
  }
  lines.push('')

  lines.push('3. ACTIONS TAKEN')
  lines.push(`   • ${feed.length} improvement${feed.length !== 1 ? 's' : ''} completed and communicated to staff`)
  lines.push(`   • ${deployed} solution${deployed !== 1 ? 's' : ''} deployed`)
  if (feed.length > 0) {
    lines.push('   • Recent improvements:')
    for (const f of feed.slice(0, 3)) {
      lines.push(`     – ${f.title}`)
    }
  }
  lines.push('')

  lines.push('4. AUTOMATIONS IN PROGRESS')
  lines.push(`   • ${inProgress} solution${inProgress !== 1 ? 's' : ''} currently being developed or tested`)
  const activePipeline = pipeline.filter(p => ['in_progress', 'testing'].includes(p.status))
  for (const p of activePipeline.slice(0, 3)) {
    lines.push(`     – ${p.title}`)
  }
  lines.push('')

  lines.push('5. IMPACT')
  lines.push(`   • ${totalHoursSaved.toFixed(1)} hours saved through improvements this period`)
  if (totalHoursWasted > 0 && totalHoursSaved > 0) {
    const ratio = ((totalHoursSaved / totalHoursWasted) * 100).toFixed(0)
    lines.push(`   • Recovery rate: ${ratio}% of identified waste addressed`)
  }
  lines.push(`   • Employee-reported issues are being resolved and communicated transparently`)
  lines.push('')

  lines.push('6. NEXT PRIORITIES')
  const upcoming = board
    .filter(r => ['accepted', 'new', 'reviewing'].includes(r.status))
    .sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0))
    .slice(0, 3)
  if (upcoming.length > 0) {
    for (const u of upcoming) {
      const desc = u.description.length > 70 ? u.description.slice(0, 67) + '...' : u.description
      lines.push(`   • ${desc}`)
    }
  } else {
    lines.push('   • Continue reviewing incoming submissions')
    lines.push('   • Focus on deploying in-progress solutions')
  }

  return lines.join('\n')
}
