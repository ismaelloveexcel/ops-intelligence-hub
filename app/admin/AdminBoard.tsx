'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import GlassCard from '@/components/GlassCard'
import { StatusBadge, ImpactBadge, DeptBadge } from '@/components/StatusBadge'
import {
  AdminBoardRow,
  SubmissionStatus,
  Department,
  Impact,
  SubmissionType,
  STATUS_LABELS,
  DEPARTMENT_LABELS,
  SUBMISSION_TYPE_LABELS,
  isQuickWin,
} from '@/lib/types'
import { ExternalLink, Search, Zap, TrendingUp } from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

type SortField = 'priority_score' | 'created_at' | 'hours_wasted_month'

const ALL_STATUSES: SubmissionStatus[] = [
  'new', 'reviewing', 'accepted', 'in_progress', 'rejected', 'implemented',
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminBoard({ rows }: { rows: AdminBoardRow[] }) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<SubmissionStatus | ''>('')
  const [filterDept, setFilterDept] = useState<Department | ''>('')
  const [filterType, setFilterType] = useState<SubmissionType | ''>('')
  const [quickWinOnly, setQuickWinOnly] = useState(false)
  const [highPriorityOnly, setHighPriorityOnly] = useState(false)
  const [sortField, setSortField] = useState<SortField>('priority_score')
  const [sortAsc, setSortAsc] = useState(false)

  const filtered = useMemo(() => {
    let result = [...rows]

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (r) =>
          r.description?.toLowerCase().includes(q) ||
          r.process_name?.toLowerCase().includes(q) ||
          (r.display_name && r.display_name.toLowerCase().includes(q))
      )
    }

    // Filters
    if (filterStatus) result = result.filter((r) => r.status === filterStatus)
    if (filterDept) result = result.filter((r) => r.department === filterDept)
    if (filterType) result = result.filter((r) => r.submission_type === filterType)
    if (quickWinOnly) result = result.filter((r) => isQuickWin(r.automation_potential, r.implementation_effort))
    if (highPriorityOnly) result = result.filter((r) => r.priority === 'high' || r.priority === 'urgent')

    // Sort
    result.sort((a, b) => {
      let aVal: number
      let bVal: number

      if (sortField === 'created_at') {
        aVal = new Date(a.created_at).getTime()
        bVal = new Date(b.created_at).getTime()
      } else if (sortField === 'hours_wasted_month') {
        aVal = a.hours_wasted_month ?? 0
        bVal = b.hours_wasted_month ?? 0
      } else {
        aVal = a.priority_score ?? 0
        bVal = b.priority_score ?? 0
      }

      return sortAsc ? aVal - bVal : bVal - aVal
    })

    return result
  }, [rows, search, filterStatus, filterDept, filterType, quickWinOnly, highPriorityOnly, sortField, sortAsc])

  // Status counts (from full rows, not filtered) — single-pass for efficiency
  const counts = useMemo(() => {
    const initialCounts = ALL_STATUSES.reduce<Record<SubmissionStatus, number>>(
      (acc, s) => {
        acc[s] = 0
        return acc
      },
      {} as Record<SubmissionStatus, number>
    )

    for (const row of rows) {
      initialCounts[row.status] += 1
    }

    return initialCounts
  }, [rows])

  function handleSortToggle(field: SortField) {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(false)
    }
  }

  const hasFilters = search || filterStatus || filterDept || filterType || quickWinOnly || highPriorityOnly

  return (
    <>
      {/* Status counts row */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={filterStatus === s}
            onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
            className="text-left"
          >
            <GlassCard className={`py-3 px-2 text-center transition-colors ${filterStatus === s ? 'border-teal/50' : ''}`}>
              <div className="text-xl font-bold text-teal">{counts[s]}</div>
              <div className="text-white/35 text-[10px] font-mono uppercase tracking-widest mt-1">
                {STATUS_LABELS[s]}
              </div>
            </GlassCard>
          </button>
        ))}
      </div>

      {/* Search + Filters */}
      <GlassCard className="p-4 mb-6">
        <div className="flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, process, description…"
              className="input text-sm pl-9 w-full"
            />
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as SubmissionStatus | '')}
              className="input text-xs py-1.5 px-2"
            >
              <option value="">All Statuses</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>

            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value as Department | '')}
              className="input text-xs py-1.5 px-2"
            >
              <option value="">All Depts</option>
              {(Object.keys(DEPARTMENT_LABELS) as Department[]).map((d) => (
                <option key={d} value={d}>{DEPARTMENT_LABELS[d]}</option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as SubmissionType | '')}
              className="input text-xs py-1.5 px-2"
            >
              <option value="">All Types</option>
              {(Object.keys(SUBMISSION_TYPE_LABELS) as SubmissionType[]).map((t) => (
                <option key={t} value={t}>{SUBMISSION_TYPE_LABELS[t]}</option>
              ))}
            </select>

            {/* Quick Win toggle */}
            <button
              type="button"
              aria-pressed={quickWinOnly}
              onClick={() => setQuickWinOnly(!quickWinOnly)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                quickWinOnly
                  ? 'border-success/50 bg-success/15 text-success'
                  : 'border-white/10 bg-white/[0.04] text-white/40 hover:text-white/60'
              }`}
            >
              <Zap size={12} />
              Quick Wins
            </button>

            {/* High priority toggle */}
            <button
              type="button"
              aria-pressed={highPriorityOnly}
              onClick={() => setHighPriorityOnly(!highPriorityOnly)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                highPriorityOnly
                  ? 'border-danger/50 bg-danger/15 text-danger'
                  : 'border-white/10 bg-white/[0.04] text-white/40 hover:text-white/60'
              }`}
            >
              <TrendingUp size={12} />
              High Priority
            </button>

            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setFilterStatus('')
                  setFilterDept('')
                  setFilterType('')
                  setQuickWinOnly(false)
                  setHighPriorityOnly(false)
                }}
                className="text-white/30 text-xs hover:text-white/60 transition-colors underline"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Sort row */}
          <div className="flex items-center gap-2 text-xs text-white/40 font-mono">
            <span>Sort:</span>
            {([
              ['priority_score', 'Priority Score'],
              ['created_at', 'Date'],
              ['hours_wasted_month', 'Hours Wasted'],
            ] as [SortField, string][]).map(([field, label]) => (
              <button
                key={field}
                type="button"
                onClick={() => handleSortToggle(field)}
                className={`px-2 py-1 rounded transition-colors ${
                  sortField === field ? 'bg-teal/15 text-teal' : 'hover:text-white/60'
                }`}
              >
                {label} {sortField === field ? (sortAsc ? '↑' : '↓') : ''}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Results count */}
      <p className="text-white/30 text-xs font-mono mb-3">
        {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        {hasFilters ? ` (filtered from ${rows.length})` : ''}
      </p>

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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-white/30 py-12">
                    {hasFilters ? 'No matching submissions.' : 'No submissions yet.'}
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const qw = isQuickWin(row.automation_potential, row.implementation_effort)
                  return (
                    <tr
                      key={row.id}
                      className={`${row.status === 'new' ? 'row-new' : ''} ${qw ? 'border-l-2 border-l-success/40' : ''}`}
                    >
                      <td className="text-white/40 text-xs font-mono whitespace-nowrap">
                        {formatDate(row.created_at)}
                      </td>
                      <td>
                        <DeptBadge department={row.department as Department} size="sm" />
                      </td>
                      <td>
                        <div className="flex items-start gap-2">
                          <div>
                            <p className="text-white/80 text-sm line-clamp-2 max-w-xs">
                              {row.description}
                            </p>
                            {row.display_name && (
                              <p className="text-white/30 text-xs mt-0.5">{row.display_name}</p>
                            )}
                          </div>
                          {qw && (
                            <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-success/15 border border-success/25 text-success text-[10px] font-mono">
                              <Zap size={10} /> Quick Win
                            </span>
                          )}
                        </div>
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
                  )
                })
              )}
            </tbody>
          </table>
        </GlassCard>
      </div>

      {/* Cards — Mobile */}
      <div className="flex flex-col gap-3 sm:hidden">
        {filtered.length === 0 ? (
          <GlassCard className="py-10 text-center text-white/30 text-sm">
            {hasFilters ? 'No matching submissions.' : 'No submissions yet.'}
          </GlassCard>
        ) : (
          filtered.map((row) => {
            const qw = isQuickWin(row.automation_potential, row.implementation_effort)
            return (
              <GlassCard
                key={row.id}
                leftAccent={row.status === 'new'}
                className={`p-4 ${qw ? 'border-l-2 border-l-success/40' : ''}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap gap-1.5">
                    <DeptBadge department={row.department as Department} size="sm" />
                    <ImpactBadge impact={row.impact as Impact} size="sm" />
                    {qw && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-success/15 border border-success/25 text-success text-[10px] font-mono">
                        <Zap size={10} /> Quick Win
                      </span>
                    )}
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
            )
          })
        )}
      </div>
    </>
  )
}
