'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import GlassCard from '@/components/GlassCard'
import ImpactDot from '@/components/ImpactDot'
import { Department, Frequency, Impact } from '@/lib/types'
import { ChevronLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

// ─── Field helpers ────────────────────────────────────────────────────────────

interface SelectFieldProps {
  label: string
  id: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  children: React.ReactNode
}

function SelectField({ label, id, value, onChange, required, children }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="mono-label">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="input"
      >
        {children}
      </select>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SubmitPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [name, setName] = useState('')
  const [department, setDepartment] = useState<Department | ''>('')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState<Frequency | ''>('')
  const [impact, setImpact] = useState<Impact | ''>('')
  const [suggestedFix, setSuggestedFix] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submitted_by: isAnonymous ? null : name.trim() || null,
          is_anonymous: isAnonymous,
          department,
          description: description.trim(),
          frequency,
          impact,
          suggested_fix: suggestedFix.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Something went wrong. Please try again.')
      }

      router.push('/submit/done')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unexpected error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen px-5 pt-10 pb-10 max-w-xl mx-auto">
      {/* Back nav */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-white/40 text-sm mb-8 hover:text-white/70 transition-colors"
      >
        <ChevronLeft size={16} />
        Back
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <ImpactDot />
          <p className="mono-label">New Submission</p>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Report a Pain Point</h1>
        <p className="text-white/50 text-sm mt-2 leading-relaxed">
          Help us fix what&apos;s slowing the team down. Takes about 60 seconds.
        </p>
      </div>

      <GlassCard className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Anonymous Toggle */}
          <div>
            <p className="mono-label mb-3">Identity</p>
            <button
              type="button"
              onClick={() => setIsAnonymous((v) => !v)}
              className="toggle-wrapper"
              aria-pressed={isAnonymous}
            >
              <div className={`toggle ${isAnonymous ? 'on' : ''}`}>
                <div className="toggle-thumb" />
              </div>
              <span className="text-sm text-white/70">
                {isAnonymous ? (
                  <span>
                    Submitting <span className="text-teal font-semibold">anonymously</span>
                  </span>
                ) : (
                  'Submit anonymously'
                )}
              </span>
            </button>
          </div>

          {/* Name (hidden when anonymous) */}
          {!isAnonymous && (
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="mono-label">
                Your Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah M."
                className="input"
              />
            </div>
          )}

          {/* Department */}
          <SelectField
            label="Department"
            id="department"
            value={department}
            onChange={(v) => setDepartment(v as Department)}
            required
          >
            <option value="" disabled>Select department…</option>
            <option value="sales">Sales</option>
            <option value="operations">Operations</option>
            <option value="client_service">Client Service</option>
            <option value="finance">Finance</option>
            <option value="admin">Admin</option>
            <option value="other">Other</option>
          </SelectField>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label htmlFor="description" className="mono-label">
              What&apos;s the problem?
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the pain point clearly. What are you doing manually? What breaks or slows you down?"
              required
              maxLength={2000}
              className="input"
              rows={4}
            />
            <span className="text-white/25 text-xs text-right font-mono">
              {description.length}/2000
            </span>
          </div>

          {/* Frequency */}
          <SelectField
            label="How often does this happen?"
            id="frequency"
            value={frequency}
            onChange={(v) => setFrequency(v as Frequency)}
            required
          >
            <option value="" disabled>Select frequency…</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="occasional">Occasionally</option>
          </SelectField>

          {/* Impact */}
          <SelectField
            label="Impact level"
            id="impact"
            value={impact}
            onChange={(v) => setImpact(v as Impact)}
            required
          >
            <option value="" disabled>Select impact…</option>
            <option value="low">Low — minor inconvenience</option>
            <option value="medium">Medium — regularly wastes time</option>
            <option value="high">High — major blocker or risk</option>
          </SelectField>

          {/* Suggested Fix (optional) */}
          <div className="flex flex-col gap-2">
            <label htmlFor="suggested_fix" className="mono-label">
              Suggested Fix{' '}
              <span className="text-white/30 normal-case tracking-normal text-xs ml-1">
                (optional)
              </span>
            </label>
            <textarea
              id="suggested_fix"
              value={suggestedFix}
              onChange={(e) => setSuggestedFix(e.target.value)}
              placeholder="Any idea how this could be solved? Even a rough idea helps."
              maxLength={1000}
              className="input"
              rows={3}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-danger text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !department || !description.trim() || !frequency || !impact}
            className="btn-primary w-full mt-1"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Submitting…
              </>
            ) : (
              'Submit Issue'
            )}
          </button>

          <p className="text-white/25 text-xs text-center">
            {isAnonymous
              ? 'Your identity will not be recorded.'
              : 'Your name is visible to the operations admin only.'}
          </p>
        </form>
      </GlassCard>
    </main>
  )
}
