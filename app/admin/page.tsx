import Link from 'next/link'
import GlassCard from '@/components/GlassCard'
import { StatusBadge, ImpactBadge, DeptBadge } from '@/components/StatusBadge'
import ImpactDot from '@/components/ImpactDot'
import { supabaseAdmin } from '@/lib/supabase'
import {
  AdminBoardRow,
  SubmissionStatus,
  Department,
  Impact,
  STATUS_LABELS,
} from '@/lib/types'
import { ExternalLink, ShieldAlert } from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

async function getAdminBoard(): Promise<AdminBoardRow[]> {
  try {
    const { data } = await supabaseAdmin
      .from('admin_board')
      .select('*')
      .order('created_at', { ascending: false })
    return (data ?? []) as AdminBoardRow[]
  } catch {
    return []
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

const ALL_STATUSES: SubmissionStatus[] = [
  'new',
  'reviewing',
  'accepted',
  'in_progress',
  'rejected',
  'implemented',
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  const rows = await getAdminBoard()

  // Status counts
  const counts = ALL_STATUSES.reduce<Record<SubmissionStatus, number>>(
    (acc, s) => {
      acc[s] = rows.filter((r) => r.status === s).length
      return acc
    },
    {} as Record<SubmissionStatus, number>
  )

  return (
    <main className="min-h-screen px-4 pt-10 pb-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ImpactDot />
            <p className="mono-label">Admin</p>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Triage Board</h1>
          <p className="text-white/40 text-sm mt-1">
            {rows.length} total submission{rows.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gold/25 bg-gold/8 text-gold text-xs font-mono">
          <ShieldAlert size={13} />
          Admin only
        </div>
      </div>

      {/* Status counts row */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-8">
        {ALL_STATUSES.map((s) => (
          <GlassCard key={s} className="py-3 px-2 text-center">
            <div className="text-xl font-bold text-teal">{counts[s]}</div>
            <div className="text-white/35 text-[10px] font-mono uppercase tracking-widest mt-1">
              {STATUS_LABELS[s]}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Table — Desktop */}
      <div className="hidden sm:block">
        <GlassCard className="p-0 overflow-hidden">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Dept</th>
                <th>Issue</th>
                <th>Impact</th>
                <th>Frequency</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-white/30 py-12">
                    No submissions yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className={row.status === 'new' ? 'row-new' : ''}>
                    <td className="text-white/40 text-xs font-mono whitespace-nowrap">
                      {formatDate(row.created_at)}
                    </td>
                    <td>
                      <DeptBadge department={row.department as Department} size="sm" />
                    </td>
                    <td>
                      <p className="text-white/80 text-sm line-clamp-2 max-w-xs">
                        {row.description}
                      </p>
                      {row.display_name && (
                        <p className="text-white/30 text-xs mt-0.5">{row.display_name}</p>
                      )}
                    </td>
                    <td>
                      <ImpactBadge impact={row.impact as Impact} size="sm" />
                    </td>
                    <td className="text-white/40 text-xs font-mono capitalize">
                      {row.frequency}
                    </td>
                    <td>
                      <StatusBadge status={row.status as SubmissionStatus} size="sm" />
                    </td>
                    <td>
                      <Link
                        href={`/admin/${row.id}`}
                        className="inline-flex items-center gap-1 text-teal text-xs font-semibold hover:opacity-75 transition-opacity"
                      >
                        Review <ExternalLink size={11} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </GlassCard>
      </div>

      {/* Cards — Mobile */}
      <div className="flex flex-col gap-3 sm:hidden">
        {rows.length === 0 ? (
          <GlassCard className="py-10 text-center text-white/30 text-sm">
            No submissions yet.
          </GlassCard>
        ) : (
          rows.map((row) => (
            <GlassCard
              key={row.id}
              leftAccent={row.status === 'new'}
              className="p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex flex-wrap gap-1.5">
                  <DeptBadge department={row.department as Department} size="sm" />
                  <ImpactBadge impact={row.impact as Impact} size="sm" />
                </div>
                <StatusBadge status={row.status as SubmissionStatus} size="sm" />
              </div>
              <p className="text-white/75 text-sm leading-snug mb-2 line-clamp-3">
                {row.description}
              </p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-white/30 text-xs font-mono">
                    {formatDate(row.created_at)}
                  </span>
                  {row.display_name && (
                    <>
                      <span className="text-white/15">·</span>
                      <span className="text-white/30 text-xs">{row.display_name}</span>
                    </>
                  )}
                </div>
                <Link
                  href={`/admin/${row.id}`}
                  className="text-teal text-xs font-semibold flex items-center gap-1"
                >
                  Review <ExternalLink size={11} />
                </Link>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </main>
  )
}
