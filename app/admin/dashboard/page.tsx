import GlassCard from '@/components/GlassCard'
import ImpactDot from '@/components/ImpactDot'
import { supabaseAdmin } from '@/lib/supabase'
import {
  AdminBoardRow,
  STATUS_LABELS,
  SubmissionStatus,
  DEPARTMENT_LABELS,
  Department,
} from '@/lib/types'
import { ShieldAlert, TrendingUp, Clock, Zap, CheckCircle, BarChart3, ArrowRightLeft, Lightbulb, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// ─── Data ─────────────────────────────────────────────────────────────────────

async function getDashboardData() {
  try {
    const [boardRes, feedRes, pipelineRes] = await Promise.all([
      supabaseAdmin.from('admin_board').select('*'),
      supabaseAdmin.from('feed_items').select('hours_saved, visibility'),
      supabaseAdmin.from('execution_pipeline').select('status, actual_hours_saved, visibility'),
    ])

    const board = (boardRes.data ?? []) as AdminBoardRow[]
    const feedItems = feedRes.data ?? []
    const pipeline = pipelineRes.data ?? []

    const total = board.length
    const statusCounts: Record<string, number> = {}
    const deptCounts: Record<string, number> = {}

    for (const r of board) {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1
      deptCounts[r.department] = (deptCounts[r.department] || 0) + 1
    }

    const totalHoursWasted = board.reduce(
      (sum, r) => sum + (r.hours_wasted_month ?? 0), 0
    )

    const hoursSavedFeed = feedItems.reduce(
      (sum: number, r: { hours_saved: number | null }) => sum + (r.hours_saved ?? 0), 0
    )
    const hoursSavedPipeline = pipeline.reduce(
      (sum: number, r: { actual_hours_saved: number | null }) => sum + (r.actual_hours_saved ?? 0), 0
    )
    const totalHoursSaved = hoursSavedFeed + hoursSavedPipeline

    const deploymentsCount = pipeline.filter(
      (r: { status: string }) => r.status === 'deployed'
    ).length

    // Pipeline visibility breakdown
    const pipelinePublic = pipeline.filter(
      (r: { visibility?: string }) => r.visibility === 'public'
    ).length
    const pipelinePrivate = pipeline.length - pipelinePublic

    const activeItems = board.filter(
      (r) => !['implemented', 'rejected'].includes(r.status)
    )

    const topBottlenecks = [...activeItems]
      .sort((a, b) => (b.hours_wasted_month ?? 0) - (a.hours_wasted_month ?? 0))
      .slice(0, 5)

    const quickWins = activeItems
      .filter((r) => (r.automation_potential ?? 0) >= 4 && r.implementation_effort === 'quick')
      .slice(0, 5)

    // Conversion metrics
    const actionedCount = board.filter(
      (r) => ['accepted', 'in_progress', 'implemented'].includes(r.status)
    ).length
    const conversionRate = total > 0 ? Math.round((actionedCount / total) * 100) : 0

    return {
      total,
      statusCounts,
      deptCounts,
      totalHoursWasted,
      totalHoursSaved,
      deploymentsCount,
      topBottlenecks,
      quickWins,
      quickWinsCount: quickWins.length,
      conversionRate,
      actionedCount,
      pipelinePublic,
      pipelinePrivate,
    }
  } catch {
    return {
      total: 0,
      statusCounts: {} as Record<string, number>,
      deptCounts: {} as Record<string, number>,
      totalHoursWasted: 0,
      totalHoursSaved: 0,
      deploymentsCount: 0,
      topBottlenecks: [] as AdminBoardRow[],
      quickWins: [] as AdminBoardRow[],
      quickWinsCount: 0,
      conversionRate: 0,
      actionedCount: 0,
      pipelinePublic: 0,
      pipelinePrivate: 0,
    }
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const data = await getDashboardData()

  const ALL_STATUSES: SubmissionStatus[] = [
    'new', 'reviewing', 'accepted', 'in_progress', 'implemented', 'rejected',
  ]

  return (
    <main className="min-h-screen px-4 pt-10 pb-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ImpactDot />
            <p className="mono-label">Dashboard</p>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Ops Intelligence Dashboard</h1>
          <p className="text-white/40 text-sm mt-1">
            Real-time view of operational pain points, automation progress, and impact.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gold/25 bg-gold/[0.08] text-gold text-xs font-mono">
          <ShieldAlert size={13} />
          Admin only
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {[
          { icon: BarChart3, value: data.total, label: 'Total Submissions' },
          { icon: Clock, value: `${data.totalHoursWasted.toFixed(0)}h`, label: 'Hours Wasted/Mo' },
          { icon: CheckCircle, value: `${data.totalHoursSaved.toFixed(0)}h`, label: 'Hours Saved' },
          { icon: Zap, value: data.deploymentsCount, label: 'Deployed' },
          { icon: ArrowRightLeft, value: `${data.conversionRate}%`, label: 'Conversion Rate' },
          { icon: Lightbulb, value: data.quickWinsCount, label: 'Quick Wins' },
        ].map(({ icon: Icon, value, label }) => (
          <GlassCard key={label} className="stat-card">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Icon size={16} className="text-gold/60" />
            </div>
            <div className="stat-number">{value}</div>
            <div className="stat-label">{label}</div>
          </GlassCard>
        ))}
      </div>

      {/* Pipeline Visibility */}
      <div className="mb-8">
        <p className="mono-label mb-4">Pipeline Visibility</p>
        <div className="grid grid-cols-2 gap-3">
          <GlassCard className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye size={14} className="text-gold/60" />
              <span className="text-white/60 text-sm">Public Items</span>
            </div>
            <span className="text-gold font-mono font-bold">{data.pipelinePublic}</span>
          </GlassCard>
          <GlassCard className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <EyeOff size={14} className="text-white/40" />
              <span className="text-white/60 text-sm">Private Items</span>
            </div>
            <span className="text-white/50 font-mono font-bold">{data.pipelinePrivate}</span>
          </GlassCard>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-8">
        {ALL_STATUSES.map((s) => (
          <GlassCard key={s} className="py-3 px-2 text-center">
            <div className="text-xl font-bold text-gold">{data.statusCounts[s] ?? 0}</div>
            <div className="text-white/35 text-[10px] font-mono uppercase tracking-widest mt-1">
              {STATUS_LABELS[s]}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Department Breakdown */}
      <div className="mb-8">
        <p className="mono-label mb-4">By Department</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(data.deptCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([dept, count]) => (
              <GlassCard key={dept} className="px-4 py-3 flex justify-between items-center">
                <span className="text-white/60 text-sm">
                  {DEPARTMENT_LABELS[dept as Department] ?? dept}
                </span>
                <span className="text-gold font-mono font-bold">{count}</span>
              </GlassCard>
            ))}
        </div>
      </div>

      {/* Two Column: Top Bottlenecks + Quick Wins */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {/* Top Bottlenecks */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-danger" />
            <p className="mono-label">Top Bottlenecks</p>
          </div>
          {data.topBottlenecks.length === 0 ? (
            <GlassCard className="p-4 text-white/30 text-sm text-center">
              No bottleneck data yet.
            </GlassCard>
          ) : (
            <div className="flex flex-col gap-2">
              {data.topBottlenecks.map((item) => (
                <Link key={item.id} href={`/admin/${item.id}`}>
                  <GlassCard className="p-4 hover:border-gold/25 transition-colors">
                    <p className="text-white/80 text-sm line-clamp-2 mb-2">{item.description}</p>
                    <div className="flex gap-3 text-xs font-mono">
                      {item.hours_wasted_month != null && (
                        <span className="text-danger">{item.hours_wasted_month.toFixed(1)}h/mo wasted</span>
                      )}
                      {item.frustration_level != null && (
                        <span className="text-gold">Frustration: {item.frustration_level}/5</span>
                      )}
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Wins */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap size={14} className="text-success" />
            <p className="mono-label">Quick Wins</p>
          </div>
          {data.quickWins.length === 0 ? (
            <GlassCard className="p-4 text-white/30 text-sm text-center">
              No quick wins identified yet. Review submissions and set automation potential + effort.
            </GlassCard>
          ) : (
            <div className="flex flex-col gap-2">
              {data.quickWins.map((item) => (
                <Link key={item.id} href={`/admin/${item.id}`}>
                  <GlassCard className="p-4 hover:border-gold/25 transition-colors">
                    <p className="text-white/80 text-sm line-clamp-2 mb-2">{item.description}</p>
                    <div className="flex gap-3 text-xs font-mono">
                      <span className="text-gold">Auto: {item.automation_potential}/5</span>
                      <span className="text-success">Effort: Quick</span>
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Links */}
      <div className="flex flex-wrap gap-3">
        <Link href="/admin" className="btn-secondary text-sm">
          Triage Board →
        </Link>
        <Link href="/admin/pipeline" className="btn-secondary text-sm">
          Execution Pipeline →
        </Link>
        <Link href="/admin/attention" className="btn-secondary text-sm">
          Needs Attention →
        </Link>
        <Link href="/admin/reports" className="btn-secondary text-sm">
          Reports →
        </Link>
        <Link href="/admin/work" className="btn-secondary text-sm">
          Active Work →
        </Link>
        <Link href="/admin/audit" className="btn-secondary text-sm">
          Audit Log →
        </Link>
      </div>
    </main>
  )
}
