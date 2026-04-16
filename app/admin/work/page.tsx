import GlassCard from '@/components/GlassCard'
import ImpactDot from '@/components/ImpactDot'
import { supabaseAdmin } from '@/lib/supabase'
import { ExecutionPipelineItem, EXECUTION_STATUS_LABELS, ExecutionStatus } from '@/lib/types'
import { ShieldAlert, Briefcase } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getActiveWork(): Promise<ExecutionPipelineItem[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('execution_pipeline')
      .select('*')
      .in('status', ['in_progress', 'testing'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch active work from execution_pipeline:', error)
      return []
    }

    return (data ?? []) as ExecutionPipelineItem[]
  } catch (error) {
    console.error('Unexpected error while fetching active work:', error)
    return []
  }
}

function statusColor(s: ExecutionStatus): string {
  switch (s) {
    case 'in_progress': return 'text-gold'
    case 'testing': return 'text-blue-teal'
    default: return 'text-white/50'
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function ActiveWorkPage() {
  const items = await getActiveWork()

  return (
    <main className="min-h-screen px-4 pt-10 pb-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ImpactDot />
            <p className="mono-label">My Work</p>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Active Work</h1>
          <p className="text-white/40 text-sm mt-1">
            Pipeline items currently in progress or testing — your daily working list.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gold/25 bg-gold/[0.08] text-gold text-xs font-mono">
          <ShieldAlert size={13} />
          Admin only
        </div>
      </div>

      {items.length === 0 ? (
        <GlassCard className="py-16 text-center">
          <Briefcase size={36} className="text-gold/40 mx-auto mb-4" />
          <h2 className="text-white/60 font-semibold mb-2">No active work</h2>
          <p className="text-white/30 text-sm mb-6">
            Nothing is currently in progress or testing. Check the pipeline for planned items.
          </p>
          <Link href="/admin/pipeline" className="btn-primary inline-flex text-sm">
            View Pipeline
          </Link>
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <GlassCard key={item.id} className="p-5 hover:border-gold/25 transition-colors">
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
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs font-mono text-white/40">
                <span>Created: {formatDate(item.created_at)}</span>
                {item.linked_submission_id && (
                  <Link
                    href={`/admin/${item.linked_submission_id}`}
                    className="text-gold hover:underline"
                  >
                    View Submission →
                  </Link>
                )}
                {item.tool_used && <span>Tool: {item.tool_used}</span>}
                {item.before_time != null && item.after_time != null && (
                  <span>
                    {item.before_time}min → {item.after_time}min
                  </span>
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
