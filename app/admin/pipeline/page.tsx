import GlassCard from '@/components/GlassCard'
import ImpactDot from '@/components/ImpactDot'
import { supabaseAdmin } from '@/lib/supabase'
import { ExecutionPipelineItem, EXECUTION_STATUS_LABELS, ExecutionStatus, Visibility } from '@/lib/types'
import { ShieldAlert, Plus, Rocket, Clock, CheckCircle, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getPipeline(): Promise<ExecutionPipelineItem[]> {
  try {
    const { data } = await supabaseAdmin
      .from('execution_pipeline')
      .select('*')
      .order('created_at', { ascending: false })
    return (data ?? []) as ExecutionPipelineItem[]
  } catch {
    return []
  }
}

function statusColor(s: ExecutionStatus): string {
  switch (s) {
    case 'deployed': return 'text-success'
    case 'in_progress': return 'text-gold'
    case 'testing': return 'text-blue-teal'
    case 'cancelled': return 'text-danger'
    default: return 'text-white/50'
  }
}

export default async function PipelinePage() {
  const items = await getPipeline()

  const deployed = items.filter((i) => i.status === 'deployed')
  const active = items.filter((i) => ['planned', 'in_progress', 'testing'].includes(i.status))
  const totalSaved = items.reduce((sum, i) => sum + (i.actual_hours_saved ?? 0), 0)
  const privateCount = items.filter((i) => i.visibility === 'private').length
  const publicCount = items.filter((i) => i.visibility === 'public').length

  return (
    <main className="min-h-screen px-4 pt-10 pb-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ImpactDot />
            <p className="mono-label">Execution Pipeline</p>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Delivery Tracker</h1>
          <p className="text-white/40 text-sm mt-1">
            Track what&apos;s being built, deployed, and the impact achieved.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/pipeline/new" className="btn-primary text-sm py-2.5 px-4">
            <Plus size={15} /> Add Item
          </Link>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gold/25 bg-gold/8 text-gold text-xs font-mono">
            <ShieldAlert size={13} />
            Admin
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-8">
        <GlassCard className="stat-card">
          <Rocket size={16} className="text-teal/60 mx-auto mb-1" />
          <div className="stat-number">{deployed.length}</div>
          <div className="stat-label">Deployed</div>
        </GlassCard>
        <GlassCard className="stat-card">
          <Clock size={16} className="text-gold/60 mx-auto mb-1" />
          <div className="stat-number">{active.length}</div>
          <div className="stat-label">In Progress</div>
        </GlassCard>
        <GlassCard className="stat-card">
          <CheckCircle size={16} className="text-success/60 mx-auto mb-1" />
          <div className="stat-number">{totalSaved.toFixed(0)}h</div>
          <div className="stat-label">Hours Saved</div>
        </GlassCard>
        <GlassCard className="stat-card">
          <Eye size={16} className="text-teal/60 mx-auto mb-1" />
          <div className="stat-number">{publicCount}</div>
          <div className="stat-label">Public</div>
        </GlassCard>
        <GlassCard className="stat-card">
          <EyeOff size={16} className="text-white/40 mx-auto mb-1" />
          <div className="stat-number">{privateCount}</div>
          <div className="stat-label">Private</div>
        </GlassCard>
      </div>

      {/* Pipeline items */}
      {items.length === 0 ? (
        <GlassCard className="py-16 text-center">
          <Rocket size={36} className="text-teal/40 mx-auto mb-4" />
          <h2 className="text-white/60 font-semibold mb-2">No pipeline items yet</h2>
          <p className="text-white/30 text-sm mb-6">
            Start tracking your automation builds and deployments.
          </p>
          <Link href="/admin/pipeline/new" className="btn-primary inline-flex text-sm">
            <Plus size={15} /> Create First Item
          </Link>
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <GlassCard key={item.id} className="p-5 hover:border-teal/25 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-white font-semibold text-sm">{item.title}</h3>
                  {item.solution_type && (
                    <span className="text-white/40 text-xs">{item.solution_type}</span>
                  )}
                </div>
                <span className={`badge badge-dept text-xs ${statusColor(item.status as ExecutionStatus)}`}>
                  {EXECUTION_STATUS_LABELS[item.status as ExecutionStatus]}
                </span>
                <span className={`inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full border ${
                  (item.visibility as Visibility) === 'public'
                    ? 'border-teal/25 bg-teal/10 text-teal'
                    : 'border-white/15 bg-white/5 text-white/40'
                }`}>
                  {(item.visibility as Visibility) === 'public' ? <Eye size={11} /> : <EyeOff size={11} />}
                  {(item.visibility as Visibility) === 'public' ? 'Public' : 'Private'}
                </span>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs font-mono text-white/40">
                {item.tool_used && <span>Tool: {item.tool_used}</span>}
                {item.before_time != null && item.after_time != null && (
                  <span>
                    {item.before_time}min → {item.after_time}min
                  </span>
                )}
                {item.actual_hours_saved != null && (
                  <span className="text-success">{item.actual_hours_saved}h saved</span>
                )}
                {item.deployed_link && (
                  <a
                    href={item.deployed_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal hover:underline"
                  >
                    View →
                  </a>
                )}
              </div>

              {item.notes && (
                <p className="text-white/40 text-xs mt-2 line-clamp-2">{item.notes}</p>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </main>
  )
}
