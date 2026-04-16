import GlassCard from '@/components/GlassCard'
import ImpactDot from '@/components/ImpactDot'
import { supabaseAdmin } from '@/lib/supabase'
import { AdminBoardRow, ExecutionPipelineItem, STATUS_LABELS, SubmissionStatus, EXECUTION_STATUS_LABELS, ExecutionStatus, Department, DEPARTMENT_LABELS } from '@/lib/types'
import { ShieldAlert, AlertTriangle, Clock } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const STUCK_SUBMISSION_DAYS = 3
const STUCK_PIPELINE_DAYS = 4

// ─── Data ─────────────────────────────────────────────────────────────────────

async function getStuckSubmissions(): Promise<AdminBoardRow[]> {
  try {
    const cutoffDate = new Date(Date.now() - STUCK_SUBMISSION_DAYS * 86400000).toISOString()
    const { data } = await supabaseAdmin
      .from('admin_board')
      .select('*')
      .in('status', ['new', 'reviewing'])
      .lt('created_at', cutoffDate)
      .order('created_at', { ascending: true })
    return (data ?? []) as AdminBoardRow[]
  } catch {
    return []
  }
}

async function getStuckPipeline(): Promise<ExecutionPipelineItem[]> {
  try {
    const cutoffDate = new Date(Date.now() - STUCK_PIPELINE_DAYS * 86400000).toISOString()
    const { data } = await supabaseAdmin
      .from('execution_pipeline')
      .select('*')
      .eq('status', 'in_progress')
      .lt('created_at', cutoffDate)
      .order('created_at', { ascending: true })
    return (data ?? []) as ExecutionPipelineItem[]
  } catch {
    return []
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AttentionPage() {
  const [stuckSubmissions, stuckPipeline] = await Promise.all([
    getStuckSubmissions(),
    getStuckPipeline(),
  ])

  const totalItems = stuckSubmissions.length + stuckPipeline.length

  return (
    <main className="min-h-screen px-4 pt-10 pb-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ImpactDot />
            <p className="mono-label">Daily Alert Panel</p>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Needs Attention</h1>
          <p className="text-white/40 text-sm mt-1">
            {totalItems === 0
              ? 'All clear — nothing stuck or overdue.'
              : `${totalItems} item${totalItems !== 1 ? 's' : ''} requiring action.`}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gold/25 bg-gold/[0.08] text-gold text-xs font-mono">
          <ShieldAlert size={13} />
          Admin only
        </div>
      </div>

      {/* Submissions Needing Review */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={14} className="text-danger" />
          <p className="mono-label">Submissions Needing Review</p>
          <span className="ml-auto text-white/30 text-xs font-mono">
            {stuckSubmissions.length} item{stuckSubmissions.length !== 1 ? 's' : ''}
          </span>
        </div>

        {stuckSubmissions.length === 0 ? (
          <GlassCard className="p-5 text-center text-white/30 text-sm">
            No overdue submissions — all reviewed within {STUCK_SUBMISSION_DAYS} days.
          </GlassCard>
        ) : (
          <div className="flex flex-col gap-2">
            {stuckSubmissions.map((row) => {
              const age = daysAgo(row.created_at)
              const isUrgent = age >= 7
              return (
                <Link key={row.id} href={`/admin/${row.id}`}>
                  <GlassCard className={`p-4 hover:border-gold/25 transition-colors ${isUrgent ? 'border-danger/30' : 'border-gold/15'}`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`badge badge-sm ${isUrgent ? 'badge-attention' : 'badge-new'}`}>
                          {STATUS_LABELS[row.status as SubmissionStatus]}
                        </span>
                        <span className="badge badge-dept badge-sm">
                          {DEPARTMENT_LABELS[row.department as Department] ?? row.department}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Clock size={12} className={isUrgent ? 'text-danger' : 'text-gold'} />
                        <span className={`text-xs font-mono ${isUrgent ? 'text-danger' : 'text-gold'}`}>
                          {age}d ago
                        </span>
                      </div>
                    </div>
                    <p className="text-white/70 text-sm line-clamp-2">{row.description}</p>
                    {row.display_name && (
                      <p className="text-white/30 text-xs mt-1">From: {row.display_name}</p>
                    )}
                  </GlassCard>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Pipeline Items Stuck */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={14} className="text-gold" />
          <p className="mono-label">Pipeline Items Stuck</p>
          <span className="ml-auto text-white/30 text-xs font-mono">
            {stuckPipeline.length} item{stuckPipeline.length !== 1 ? 's' : ''}
          </span>
        </div>

        {stuckPipeline.length === 0 ? (
          <GlassCard className="p-5 text-center text-white/30 text-sm">
            No stuck pipeline items — all progressing within {STUCK_PIPELINE_DAYS} days.
          </GlassCard>
        ) : (
          <div className="flex flex-col gap-2">
            {stuckPipeline.map((item) => {
              const age = daysAgo(item.created_at)
              const isUrgent = age >= 10
              return (
                <GlassCard key={item.id} className={`p-4 ${isUrgent ? 'border-danger/30' : 'border-gold/15'}`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-white font-semibold text-sm">{item.title}</h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <Clock size={12} className={isUrgent ? 'text-danger' : 'text-gold'} />
                      <span className={`text-xs font-mono ${isUrgent ? 'text-danger' : 'text-gold'}`}>
                        {age}d in progress
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-white/40">
                    <span className="text-gold">
                      {EXECUTION_STATUS_LABELS[item.status as ExecutionStatus]}
                    </span>
                    {item.tool_used && <span>Tool: {item.tool_used}</span>}
                    <span>Created: {formatDate(item.created_at)}</span>
                  </div>
                  {item.notes && (
                    <p className="text-white/35 text-xs mt-2 line-clamp-2">{item.notes}</p>
                  )}
                </GlassCard>
              )
            })}
          </div>
        )}
      </section>

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        <Link href="/admin" className="btn-secondary text-sm">
          Triage Board →
        </Link>
        <Link href="/admin/pipeline" className="btn-secondary text-sm">
          Pipeline →
        </Link>
        <Link href="/admin/dashboard" className="btn-secondary text-sm">
          Dashboard →
        </Link>
      </div>
    </main>
  )
}
