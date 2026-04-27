'use client'

import { useState, useEffect, useCallback } from 'react'
import GlassCard from '@/components/GlassCard'
import ImpactDot from '@/components/ImpactDot'
import {
  ExecutionPipelineItem,
  EXECUTION_STATUS_LABELS,
  ExecutionStatus,
  Visibility,
} from '@/lib/types'
import { ShieldAlert, Plus, Rocket, Clock, CheckCircle, Eye, EyeOff, Star, Lock, Globe, Loader2 } from 'lucide-react'
import Link from 'next/link'

// ─── Visibility helpers ───────────────────────────────────────────────────────

const VISIBILITY_CYCLE: Visibility[] = ['private', 'internal', 'public']

function nextVisibility(current: Visibility): Visibility {
  const idx = VISIBILITY_CYCLE.indexOf(current)
  return VISIBILITY_CYCLE[(idx + 1) % VISIBILITY_CYCLE.length]
}

function VisibilityBadge({
  visibility,
  itemId,
  onToggle,
  toggling,
}: {
  visibility: Visibility
  itemId: string
  onToggle: (id: string, next: Visibility) => void
  toggling: boolean
}) {
  const next = nextVisibility(visibility)

  const styles: Record<Visibility, string> = {
    private: 'border-white/15 bg-white/5 text-white/40 hover:border-white/30',
    internal: 'border-sky-500/30 bg-sky-500/10 text-sky-400 hover:border-sky-500/50',
    public: 'border-gold/25 bg-gold/10 text-gold hover:border-gold/40',
  }

  const icons: Record<Visibility, React.ReactNode> = {
    private: <Lock size={10} />,
    internal: <Eye size={10} />,
    public: <Globe size={10} />,
  }

  const labels: Record<Visibility, string> = {
    private: 'Private — only you',
    internal: 'Internal — in reports',
    public: 'Public — on feed',
  }

  return (
    <button
      onClick={() => onToggle(itemId, next)}
      disabled={toggling}
      title={`Click to set ${next}`}
      className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border transition-colors ${styles[visibility]} disabled:opacity-50`}
    >
      {toggling ? <Loader2 size={9} className="animate-spin" /> : icons[visibility]}
      {labels[visibility]}
    </button>
  )
}

function statusColor(s: ExecutionStatus): string {
  switch (s) {
    case 'deployed': return 'text-success'
    case 'in_progress': return 'text-gold'
    case 'testing': return 'text-sky-400'
    case 'cancelled': return 'text-danger'
    default: return 'text-white/50'
  }
}

export default function PipelinePage() {
  const [items, setItems] = useState<ExecutionPipelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/pipeline')
      .then((r) => r.json())
      .then((d) => { setItems(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleVisibilityToggle = useCallback(async (id: string, next: Visibility) => {
    setTogglingId(id)
    // Optimistic update
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, visibility: next } : i))
    try {
      const res = await fetch(`/api/admin/pipeline/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: next }),
      })
      if (!res.ok) {
        // Revert on failure — refetch
        const r = await fetch('/api/admin/pipeline')
        const d = await r.json()
        setItems(Array.isArray(d) ? d : [])
      }
    } catch {
      const r = await fetch('/api/admin/pipeline')
      const d = await r.json()
      setItems(Array.isArray(d) ? d : [])
    } finally {
      setTogglingId(null)
    }
  }, [])

  const deployed = items.filter((i) => i.status === 'deployed')
  const active = items.filter((i) => ['planned', 'in_progress', 'testing'].includes(i.status))
  const totalSaved = items.reduce((sum, i) => sum + (i.actual_hours_saved ?? 0), 0)
  const privateCount = items.filter((i) => (i.visibility as Visibility) === 'private').length
  const internalCount = items.filter((i) => (i.visibility as Visibility) === 'internal').length
  const publicCount = items.filter((i) => (i.visibility as Visibility) === 'public').length

  // Ready to show: deployed + internal (ready to promote to public)
  const readyToShow = items.filter(
    (i) => (i.visibility as Visibility) === 'internal' && i.status === 'deployed'
  )

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
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gold/25 bg-gold/[0.08] text-gold text-xs font-mono">
            <ShieldAlert size={13} />
            Admin
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
        <GlassCard className="stat-card">
          <Rocket size={16} className="text-gold/60 mx-auto mb-1" />
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
          <Lock size={16} className="text-white/30 mx-auto mb-1" />
          <div className="stat-number">{privateCount}</div>
          <div className="stat-label">Private</div>
        </GlassCard>
        <GlassCard className="stat-card">
          <Eye size={16} className="text-sky-400/60 mx-auto mb-1" />
          <div className="stat-number">{internalCount}</div>
          <div className="stat-label">Internal</div>
        </GlassCard>
        <GlassCard className="stat-card">
          <Globe size={16} className="text-gold/60 mx-auto mb-1" />
          <div className="stat-number">{publicCount}</div>
          <div className="stat-label">Public</div>
        </GlassCard>
      </div>

      {/* Private pipeline notice */}
      {privateCount > 0 && (
        <div className="mb-6 px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/40 text-xs font-mono">
          <Lock size={11} className="inline mr-1.5 mb-0.5" />
          {privateCount} item{privateCount !== 1 ? 's' : ''} in private pipeline — not counted in reports or dashboard metrics
        </div>
      )}

      {/* Ready to Show Section */}
      {readyToShow.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Star size={14} className="text-gold" />
            <p className="mono-label">Ready to Publish</p>
            <span className="ml-auto text-white/30 text-xs font-mono">
              Internal + Deployed — flip to Public to push to feed
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {readyToShow.map((item) => (
              <GlassCard key={item.id} className="p-4 border-gold/20">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-white font-semibold text-sm">{item.title}</h3>
                    {item.tool_used && (
                      <span className="text-white/40 text-xs">Tool: {item.tool_used}</span>
                    )}
                  </div>
                  <VisibilityBadge
                    visibility={item.visibility as Visibility}
                    itemId={item.id}
                    onToggle={handleVisibilityToggle}
                    toggling={togglingId === item.id}
                  />
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline items */}
      {loading ? (
        <div className="flex items-center gap-3 text-white/40 py-12">
          <Loader2 size={16} className="animate-spin" />Loading…
        </div>
      ) : items.length === 0 ? (
        <GlassCard className="py-16 text-center">
          <Rocket size={36} className="text-gold/40 mx-auto mb-4" />
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
            <GlassCard key={item.id} className="p-5 hover:border-gold/25 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-sm">{item.title}</h3>
                  {item.solution_type && (
                    <span className="text-white/40 text-xs">{item.solution_type}</span>
                  )}
                </div>
                <span className={`badge badge-dept text-xs ${statusColor(item.status as ExecutionStatus)}`}>
                  {EXECUTION_STATUS_LABELS[item.status as ExecutionStatus]}
                </span>
                <VisibilityBadge
                  visibility={item.visibility as Visibility}
                  itemId={item.id}
                  onToggle={handleVisibilityToggle}
                  toggling={togglingId === item.id}
                />
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
                    className="text-gold hover:underline"
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

