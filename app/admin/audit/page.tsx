import GlassCard from '@/components/GlassCard'
import ImpactDot from '@/components/ImpactDot'
import { supabaseAdmin } from '@/lib/supabase'
import { ShieldAlert, ScrollText } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface AuditLogEntry {
  id: string
  created_at: string
  action: string
  entity_type: string
  entity_id: string | null
  summary: string | null
}

async function getAuditLog(): Promise<AuditLogEntry[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Failed to load admin audit log:', error)
      return []
    }

    return (data ?? []) as AuditLogEntry[]
  } catch (error) {
    console.error('Unexpected error while loading admin audit log:', error)
    return []
  }
}

function formatTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function actionColor(action: string): string {
  if (action.includes('created')) return 'text-success'
  if (action.includes('deleted')) return 'text-danger'
  if (action.includes('updated') || action.includes('saved')) return 'text-gold'
  if (action.includes('published')) return 'text-gold'
  if (action.includes('login')) return 'text-blue-teal'
  if (action.includes('logout')) return 'text-white/40'
  return 'text-white/50'
}

export default async function AuditLogPage() {
  const entries = await getAuditLog()

  return (
    <main className="min-h-screen px-4 pt-10 pb-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ImpactDot />
            <p className="mono-label">Audit Log</p>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-white/40 text-sm mt-1">
            Last {entries.length} admin actions — read-only.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gold/25 bg-gold/[0.08] text-gold text-xs font-mono">
          <ShieldAlert size={13} />
          Admin only
        </div>
      </div>

      {entries.length === 0 ? (
        <GlassCard className="py-16 text-center">
          <ScrollText size={36} className="text-gold/40 mx-auto mb-4" />
          <h2 className="text-white/60 font-semibold mb-2">No audit entries</h2>
          <p className="text-white/30 text-sm">
            Actions will appear here as you review submissions and manage the pipeline.
          </p>
        </GlassCard>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block">
            <GlassCard className="p-0 overflow-hidden">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>ID</th>
                    <th>Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="text-white/40 text-xs font-mono whitespace-nowrap">
                        {formatTimestamp(entry.created_at)}
                      </td>
                      <td>
                        <span className={`text-xs font-mono font-semibold ${actionColor(entry.action)}`}>
                          {entry.action}
                        </span>
                      </td>
                      <td className="text-white/50 text-xs font-mono">
                        {entry.entity_type}
                      </td>
                      <td className="text-white/30 text-xs font-mono">
                        {entry.entity_id ? entry.entity_id.slice(0, 8).toUpperCase() : '—'}
                      </td>
                      <td className="text-white/60 text-xs max-w-xs">
                        <span className="line-clamp-2">{entry.summary ?? '—'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-2 sm:hidden">
            {entries.map((entry) => (
              <GlassCard key={entry.id} className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`text-xs font-mono font-semibold ${actionColor(entry.action)}`}>
                    {entry.action}
                  </span>
                  <span className="text-white/30 text-[10px] font-mono whitespace-nowrap">
                    {formatTimestamp(entry.created_at)}
                  </span>
                </div>
                <div className="flex gap-2 text-xs font-mono text-white/40 mb-1">
                  <span>{entry.entity_type}</span>
                  {entry.entity_id && (
                    <>
                      <span className="text-white/15">·</span>
                      <span>{entry.entity_id.slice(0, 8).toUpperCase()}</span>
                    </>
                  )}
                </div>
                {entry.summary && (
                  <p className="text-white/50 text-xs line-clamp-2">{entry.summary}</p>
                )}
              </GlassCard>
            ))}
          </div>
        </>
      )}
    </main>
  )
}
