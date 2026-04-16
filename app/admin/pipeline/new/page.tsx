'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import GlassCard from '@/components/GlassCard'
import ImpactDot from '@/components/ImpactDot'
import { ExecutionStatus, EXECUTION_STATUS_LABELS, Visibility, VISIBILITY_LABELS } from '@/lib/types'
import { ChevronLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NewPipelineItemPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [linkedSubmissionId, setLinkedSubmissionId] = useState('')
  const [solutionType, setSolutionType] = useState('')
  const [toolUsed, setToolUsed] = useState('')
  const [status, setStatus] = useState<ExecutionStatus>('planned')
  const [deployedLink, setDeployedLink] = useState('')
  const [beforeTime, setBeforeTime] = useState('')
  const [afterTime, setAfterTime] = useState('')
  const [actualHoursSaved, setActualHoursSaved] = useState('')
  const [notes, setNotes] = useState('')
  const [visibility, setVisibility] = useState<Visibility>('private')

  // Pre-fill from query params (from "Create Execution Task" button)
  useEffect(() => {
    if (searchParams.get('title')) setTitle(searchParams.get('title') ?? '')
    if (searchParams.get('linked_submission_id')) setLinkedSubmissionId(searchParams.get('linked_submission_id') ?? '')
    if (searchParams.get('solution_type')) setSolutionType(searchParams.get('solution_type') ?? '')
    if (searchParams.get('notes')) setNotes(searchParams.get('notes') ?? '')
  }, [searchParams])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          linked_submission_id: linkedSubmissionId.trim() || null,
          solution_type: solutionType.trim() || null,
          tool_used: toolUsed.trim() || null,
          status,
          deployed_link: deployedLink.trim() || null,
          before_time: beforeTime ? parseFloat(beforeTime) : null,
          after_time: afterTime ? parseFloat(afterTime) : null,
          actual_hours_saved: actualHoursSaved ? parseFloat(actualHoursSaved) : null,
          notes: notes.trim() || null,
          visibility,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to create.')
      }

      router.push('/admin/pipeline')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen px-5 pt-10 pb-10 max-w-xl mx-auto">
      <Link
        href="/admin/pipeline"
        className="inline-flex items-center gap-1.5 text-white/40 text-sm mb-8 hover:text-white/70 transition-colors"
      >
        <ChevronLeft size={16} /> Back to Pipeline
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <ImpactDot />
          <p className="mono-label">New Pipeline Item</p>
        </div>
        <h1 className="text-xl font-bold tracking-tight">Track a Delivery</h1>
      </div>

      <GlassCard className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="mono-label">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Auto-generate weekly report"
              required
              className="input"
            />
          </div>

          {linkedSubmissionId && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-teal/10 border border-teal/20 text-teal text-xs font-mono">
              Linked to submission: {linkedSubmissionId.slice(0, 8).toUpperCase()}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="mono-label">Solution Type</label>
              <input
                type="text"
                value={solutionType}
                onChange={(e) => setSolutionType(e.target.value)}
                placeholder="e.g. Automation, Template, SOP"
                className="input"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="mono-label">Tool Used</label>
              <input
                type="text"
                value={toolUsed}
                onChange={(e) => setToolUsed(e.target.value)}
                placeholder="e.g. Make, Zapier, n8n"
                className="input"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="mono-label">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ExecutionStatus)}
              className="input"
            >
              {(Object.keys(EXECUTION_STATUS_LABELS) as ExecutionStatus[]).map((s) => (
                <option key={s} value={s}>{EXECUTION_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="mono-label">Visibility</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as Visibility)}
              className="input"
            >
              {(Object.keys(VISIBILITY_LABELS) as Visibility[]).map((v) => (
                <option key={v} value={v}>{VISIBILITY_LABELS[v]}</option>
              ))}
            </select>
            <p className="text-white/30 text-xs">
              {visibility === 'private'
                ? 'Private — visible only to admin/operator'
                : 'Public — visible in management/public views'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <label className="mono-label">Before (min)</label>
              <input
                type="number"
                value={beforeTime}
                onChange={(e) => setBeforeTime(e.target.value)}
                placeholder="e.g. 30"
                min="0"
                className="input"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="mono-label">After (min)</label>
              <input
                type="number"
                value={afterTime}
                onChange={(e) => setAfterTime(e.target.value)}
                placeholder="e.g. 2"
                min="0"
                className="input"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="mono-label">Hours Saved</label>
              <input
                type="number"
                value={actualHoursSaved}
                onChange={(e) => setActualHoursSaved(e.target.value)}
                placeholder="e.g. 8"
                min="0"
                step="0.5"
                className="input"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="mono-label">Deployed Link</label>
            <input
              type="url"
              value={deployedLink}
              onChange={(e) => setDeployedLink(e.target.value)}
              placeholder="https://..."
              className="input"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="mono-label">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Outcome summary, implementation notes…"
              rows={3}
              className="input"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-danger text-sm">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || !title.trim()} className="btn-primary w-full">
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Creating…</>
            ) : (
              'Create Pipeline Item'
            )}
          </button>
        </form>
      </GlassCard>
    </main>
  )
}
