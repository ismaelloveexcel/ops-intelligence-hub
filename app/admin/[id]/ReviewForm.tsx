'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import GlassCard from '@/components/GlassCard'
import { StatusBadge, ImpactBadge, DeptBadge } from '@/components/StatusBadge'
import ImpactDot from '@/components/ImpactDot'
import {
  AdminBoardRow,
  ActionType,
  Priority,
  Ease,
  SubmissionStatus,
  Department,
  Impact,
  Frequency,
  ACTION_TYPE_LABELS,
  PRIORITY_LABELS,
  EASE_LABELS,
  STATUS_LABELS,
  FREQUENCY_LABELS,
} from '@/lib/types'
import {
  Zap,
  BookOpen,
  Bot,
  GraduationCap,
  ArrowUpCircle,
  XCircle,
  Save,
  Rss,
  Loader2,
  CheckCircle2,
} from 'lucide-react'

// ─── Action Icon Map ──────────────────────────────────────────────────────────

const ACTION_ICONS: Record<ActionType, React.ElementType> = {
  quick_fix: Zap,
  sop_update: BookOpen,
  automation: Bot,
  training: GraduationCap,
  escalate: ArrowUpCircle,
  reject: XCircle,
}

const ACTION_TYPES: ActionType[] = [
  'quick_fix',
  'sop_update',
  'automation',
  'training',
  'escalate',
  'reject',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function SelectInput({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="mono-label">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input text-sm"
      >
        {children}
      </select>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReviewForm({ row }: { row: AdminBoardRow }) {
  const router = useRouter()

  // Review form state
  const [actionType, setActionType] = useState<ActionType | ''>(row.action_type ?? '')
  const [priority, setPriority] = useState<Priority | ''>(row.priority ?? '')
  const [ease, setEase] = useState<Ease | ''>(row.ease ?? '')
  const [owner, setOwner] = useState(row.owner ?? '')
  const [targetDate, setTargetDate] = useState(row.target_date ?? '')
  const [timeWasted, setTimeWasted] = useState(
    row.time_wasted_hrs != null ? String(row.time_wasted_hrs) : ''
  )
  const [status, setStatus] = useState<SubmissionStatus>(row.status)
  const [adminNotes, setAdminNotes] = useState(row.admin_notes ?? '')

  // Publish form state
  const [feedTitle, setFeedTitle] = useState('')
  const [feedWhatChanged, setFeedWhatChanged] = useState('')

  // Loading states
  const [savingReview, setSavingReview] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [publishMsg, setPublishMsg] = useState('')
  const [saveError, setSaveError] = useState('')
  const [publishError, setPublishError] = useState('')

  // Already published?
  const isPublished = row.published_to_feed === true

  // ─── Save review ───────────────────────────────────────────────────────────

  async function handleSave() {
    setSavingReview(true)
    setSaveMsg('')
    setSaveError('')
    try {
      const res = await fetch(`/api/admin/submissions/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_type: actionType || null,
          priority: priority || null,
          ease: ease || null,
          owner: owner.trim() || null,
          target_date: targetDate || null,
          time_wasted_hrs: timeWasted ? parseFloat(timeWasted) : null,
          admin_notes: adminNotes.trim() || null,
          status,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Save failed')
      setSaveMsg('Saved successfully')
      router.refresh()
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSavingReview(false)
    }
  }

  // ─── Publish to feed ───────────────────────────────────────────────────────

  async function handlePublish() {
    if (!feedTitle.trim() || !feedWhatChanged.trim()) {
      setPublishError('Both fields are required to publish.')
      return
    }
    setPublishing(true)
    setPublishMsg('')
    setPublishError('')
    try {
      const res = await fetch(`/api/admin/submissions/${row.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: feedTitle.trim(),
          what_changed: feedWhatChanged.trim(),
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Publish failed')
      setPublishMsg('Published to feed!')
      router.refresh()
    } catch (e: unknown) {
      setPublishError(e instanceof Error ? e.message : 'Publish failed')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Submission Detail ──────────────────────────────────────────────── */}
      <GlassCard highlighted className="p-6">
        <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ImpactDot />
              <p className="mono-label">Submission</p>
            </div>
            <p className="text-white/30 text-xs font-mono">{row.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <StatusBadge status={row.status as SubmissionStatus} />
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <DeptBadge department={row.department as Department} />
          <ImpactBadge impact={row.impact as Impact} />
          <span className="badge badge-dept">
            {FREQUENCY_LABELS[row.frequency as Frequency]}
          </span>
        </div>

        {/* Description */}
        <p className="text-white/80 text-sm leading-relaxed mb-4 border-l-2 border-teal/30 pl-4">
          {row.description}
        </p>

        {/* Suggested fix */}
        {row.suggested_fix && (
          <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] mb-4">
            <p className="mono-label mb-2">Suggested Fix</p>
            <p className="text-white/60 text-sm leading-relaxed">{row.suggested_fix}</p>
          </div>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-white/35 font-mono">
          <span>Submitted: {formatDate(row.created_at)}</span>
          <span>By: {row.display_name}</span>
          {row.reviewed_at && <span>Last reviewed: {formatDate(row.reviewed_at)}</span>}
        </div>
      </GlassCard>

      {/* ── Review Action Form ─────────────────────────────────────────────── */}
      <GlassCard className="p-6">
        <p className="mono-label mb-5">Review Action</p>

        {/* Action type button grid */}
        <div className="mb-5">
          <p className="text-white/40 text-xs font-mono uppercase tracking-widest mb-3">
            Action Type
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {ACTION_TYPES.map((type) => {
              const Icon = ACTION_ICONS[type]
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActionType(type)}
                  className={`action-btn ${actionType === type ? 'active' : ''}`}
                >
                  <Icon size={18} />
                  <span>{ACTION_TYPE_LABELS[type]}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Fields grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <SelectInput
            label="Priority"
            value={priority}
            onChange={(v) => setPriority(v as Priority | '')}
          >
            <option value="">— Priority —</option>
            {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </SelectInput>

          <SelectInput
            label="Ease of fix"
            value={ease}
            onChange={(v) => setEase(v as Ease | '')}
          >
            <option value="">— Ease —</option>
            {(Object.keys(EASE_LABELS) as Ease[]).map((e) => (
              <option key={e} value={e}>
                {EASE_LABELS[e]}
              </option>
            ))}
          </SelectInput>

          <div className="flex flex-col gap-1.5">
            <label className="mono-label">Owner</label>
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Assigned to…"
              className="input text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="mono-label">Target Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="input text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="mono-label">Hours Wasted / Week</label>
            <input
              type="number"
              value={timeWasted}
              onChange={(e) => setTimeWasted(e.target.value)}
              placeholder="e.g. 2.5"
              min="0"
              step="0.5"
              className="input text-sm"
            />
          </div>

          <SelectInput
            label="Update Status"
            value={status}
            onChange={(v) => setStatus(v as SubmissionStatus)}
          >
            {(Object.keys(STATUS_LABELS) as SubmissionStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </SelectInput>
        </div>

        {/* Admin notes */}
        <div className="flex flex-col gap-1.5 mb-5">
          <label className="mono-label">Admin Notes</label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Internal notes, context, decision rationale…"
            rows={3}
            className="input text-sm"
          />
        </div>

        {/* Save messages */}
        {saveMsg && (
          <div className="flex items-center gap-2 text-success text-sm mb-3">
            <CheckCircle2 size={15} />
            {saveMsg}
          </div>
        )}
        {saveError && (
          <div className="text-danger text-sm mb-3">{saveError}</div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={savingReview}
          className="btn-primary"
        >
          {savingReview ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save size={15} />
              Save Review
            </>
          )}
        </button>
      </GlassCard>

      {/* ── Publish to Feed ────────────────────────────────────────────────── */}
      <GlassCard className={`p-6 ${isPublished ? 'opacity-70' : ''}`}>
        <div className="flex items-center justify-between mb-5">
          <p className="mono-label">Publish to Feed</p>
          {isPublished && (
            <div className="flex items-center gap-1.5 text-success text-xs font-mono">
              <ImpactDot size="sm" />
              <span style={{ color: 'var(--success)' }}>Already published</span>
            </div>
          )}
        </div>

        {isPublished ? (
          <p className="text-white/35 text-sm">
            This submission has already been published to the public feed.
          </p>
        ) : (
          <>
            <p className="text-white/45 text-xs mb-4 leading-relaxed">
              Write a short, employee-friendly summary that will appear in the public
              &quot;You Said / We Fixed&quot; feed.
            </p>

            <div className="flex flex-col gap-4 mb-5">
              <div className="flex flex-col gap-1.5">
                <label className="mono-label">
                  Fix Title{' '}
                  <span className="text-white/30 normal-case tracking-normal text-xs ml-1">
                    visible to all employees
                  </span>
                </label>
                <input
                  type="text"
                  value={feedTitle}
                  onChange={(e) => setFeedTitle(e.target.value)}
                  placeholder="e.g. Proposal template now live for Sales team"
                  maxLength={120}
                  className="input text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="mono-label">What Changed</label>
                <textarea
                  value={feedWhatChanged}
                  onChange={(e) => setFeedWhatChanged(e.target.value)}
                  placeholder="Describe what was done and the benefit to the team. Keep it clear and positive."
                  rows={4}
                  maxLength={500}
                  className="input text-sm"
                />
                <span className="text-white/25 text-xs font-mono text-right">
                  {feedWhatChanged.length}/500
                </span>
              </div>
            </div>

            {publishMsg && (
              <div className="flex items-center gap-2 text-success text-sm mb-3">
                <CheckCircle2 size={15} />
                {publishMsg}
              </div>
            )}
            {publishError && (
              <div className="text-danger text-sm mb-3">{publishError}</div>
            )}

            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing || !feedTitle.trim() || !feedWhatChanged.trim()}
              className="btn-primary"
            >
              {publishing ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Publishing…
                </>
              ) : (
                <>
                  <Rss size={15} />
                  Publish to Feed
                </>
              )}
            </button>
          </>
        )}
      </GlassCard>
    </div>
  )
}
