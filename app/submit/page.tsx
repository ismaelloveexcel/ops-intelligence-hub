'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import GlassCard from '@/components/GlassCard'
import ImpactDot from '@/components/ImpactDot'
import { Department, Frequency, Impact, SubmissionType, SUBMISSION_TYPE_LABELS } from '@/lib/types'
import { ChevronLeft, Loader2, AlertTriangle, Lightbulb, Zap } from 'lucide-react'
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

// ─── Type selector ────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<SubmissionType, { icon: React.ElementType; label: string; desc: string }> = {
  problem: { icon: AlertTriangle, label: "Something that's broken or slow", desc: 'Report an inefficient process or issue' },
  suggestion: { icon: Lightbulb, label: 'An idea I think could help', desc: 'Suggest an improvement to how we work' },
  idea: { icon: Zap, label: 'Just a quick thought', desc: 'Quick idea — just a sentence or two' },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SubmitPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [submissionType, setSubmissionType] = useState<SubmissionType>('problem')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [name, setName] = useState('')
  const [department, setDepartment] = useState<Department | ''>('')
  const [description, setDescription] = useState('')
  const [processName, setProcessName] = useState('')
  const [systemUsed, setSystemUsed] = useState('')
  const [timePerOccurrence, setTimePerOccurrence] = useState('')
  const [occurrencesPerWeek, setOccurrencesPerWeek] = useState('')
  const [frustrationLevel, setFrustrationLevel] = useState<number | null>(null)
  const [errorRisk, setErrorRisk] = useState(false)
  const [affectsClient, setAffectsClient] = useState(false)
  const [involvesMoney, setInvolvesMoney] = useState(false)
  const [frequency, setFrequency] = useState<Frequency | ''>('')
  const [impact, setImpact] = useState<Impact | ''>('')
  const [suggestedFix, setSuggestedFix] = useState('')
  const [submitterEmail, setSubmitterEmail] = useState('')

  const isQuickIdea = submissionType === 'idea'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_type: submissionType,
          submitted_by: isAnonymous ? null : name.trim() || null,
          is_anonymous: isAnonymous,
          department,
          description: description.trim(),
          process_name: processName.trim() || null,
          system_used: systemUsed.trim() || null,
          time_per_occurrence: timePerOccurrence ? parseFloat(timePerOccurrence) : null,
          occurrences_per_week: occurrencesPerWeek ? parseFloat(occurrencesPerWeek) : null,
          frustration_level: frustrationLevel,
          error_risk: errorRisk,
          affects_client: affectsClient,
          involves_money: involvesMoney,
          frequency: isQuickIdea ? 'occasional' : frequency,
          impact: isQuickIdea ? 'medium' : impact,
          suggested_fix: suggestedFix.trim() || null,
          submitter_email: submitterEmail.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Something went wrong. Please try again.')
      }

      const data = await res.json()
      router.push(`/submit/done?ref=${data.id}`)
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
        <div className="flex items-center gap-2 mb-3">
          <ImpactDot />
          <p className="text-white/30 text-xs font-mono uppercase tracking-widest">Operations Intelligence Hub</p>
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-3">What&apos;s slowing you down?</h1>
        <p className="text-white/55 text-sm leading-relaxed">
          Anything repetitive, annoying, or wasteful — no idea is too small
        </p>
      </div>

      {/* Submission type selector */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {(Object.keys(TYPE_CONFIG) as SubmissionType[]).map((type) => {
          const { icon: Icon, label } = TYPE_CONFIG[type]
          const active = submissionType === type
          return (
            <button
              key={type}
              type="button"
              onClick={() => setSubmissionType(type)}
              className={`action-btn ${active ? 'active' : ''}`}
              title={label}
            >
              <Icon size={20} />
              <span className="text-[11px] leading-tight text-center">{label}</span>
            </button>
          )
        })}
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
                    Submitting <span className="text-gold font-semibold">anonymously</span>
                  </span>
                ) : (
                  'Keep this anonymous'
                )}
              </span>
            </button>
          </div>

          {/* Name (hidden when anonymous) */}
          {!isAnonymous && (
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="mono-label">Your Name</label>
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
            <option value="marketing">Marketing</option>
            <option value="introducers">Introducers &amp; Partners</option>
            <option value="management">Management</option>
            <option value="other">Other</option>
          </SelectField>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label htmlFor="description" className="mono-label">
              {isQuickIdea ? "What's your idea?" : "What is slowing things down?"}
            </label>
            {/* A10 — PII warning */}
            <p className="text-[11px] text-amber-400/80 leading-snug">
              Please don&apos;t include client names, account numbers, or transaction IDs
            </p>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                isQuickIdea
                  ? 'Describe it like you&apos;re telling a colleague over lunch — what happens, how often, why it&apos;s a pain'
                  : 'Describe it like you&apos;re telling a colleague over lunch — what happens, how often, why it&apos;s a pain'
              }
              required
              maxLength={2000}
              className="input"
              rows={4}
            />
            <span className="text-white/25 text-xs text-right font-mono">
              {description.length}/2000
            </span>
          </div>

          {/* A7 — Email field (below description, not prominent) */}
          <div className="flex flex-col gap-2">
            <label htmlFor="submitter_email" className="mono-label">
              Email{' '}
              <span className="text-white/30 normal-case tracking-normal text-xs ml-1">
                optional — I&apos;ll let you know when this is actioned
              </span>
            </label>
            <input
              id="submitter_email"
              type="email"
              value={submitterEmail}
              onChange={(e) => setSubmitterEmail(e.target.value)}
              placeholder="your@email.com"
              className="input"
              autoComplete="email"
            />
          </div>

          {/* Extended fields (not shown for quick ideas) */}
          {!isQuickIdea && (
            <>
              {/* Process & system */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="process_name" className="mono-label">
                    Process Name <span className="text-white/30 normal-case tracking-normal text-xs ml-1">(optional)</span>
                  </label>
                  <input
                    id="process_name"
                    type="text"
                    value={processName}
                    onChange={(e) => setProcessName(e.target.value)}
                    placeholder="e.g. sending weekly reports, onboarding a new client, chasing approvals..."
                    className="input"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="system_used" className="mono-label">
                    System Used <span className="text-white/30 normal-case tracking-normal text-xs ml-1">(optional)</span>
                  </label>
                  <input
                    id="system_used"
                    type="text"
                    value={systemUsed}
                    onChange={(e) => setSystemUsed(e.target.value)}
                    placeholder="e.g. Salesforce, Excel"
                    className="input"
                  />
                </div>
              </div>

              {/* Time metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="time_per" className="mono-label">
                    Time per occurrence <span className="text-white/30 normal-case tracking-normal text-xs ml-1">(mins)</span>
                  </label>
                  <input
                    id="time_per"
                    type="number"
                    min="0"
                    step="1"
                    value={timePerOccurrence}
                    onChange={(e) => setTimePerOccurrence(e.target.value)}
                    placeholder="e.g. 15"
                    className="input"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="occ_week" className="mono-label">
                    Occurrences / week
                  </label>
                  <input
                    id="occ_week"
                    type="number"
                    min="0"
                    step="1"
                    value={occurrencesPerWeek}
                    onChange={(e) => setOccurrencesPerWeek(e.target.value)}
                    placeholder="e.g. 5"
                    className="input"
                  />
                </div>
              </div>

              {/* Frustration level */}
              <div className="flex flex-col gap-2">
                <p className="mono-label">Frustration Level</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setFrustrationLevel(n)}
                      className={`action-btn flex-1 py-3 ${frustrationLevel === n ? 'active' : ''}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-white/25 text-xs font-mono">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              {/* Risk flags */}
              <div className="flex flex-col gap-3">
                <p className="mono-label">Risk Flags <span className="text-white/30 normal-case tracking-normal text-xs ml-1">(check any that apply)</span></p>
                {[
                  { label: 'Risk of errors / mistakes', value: errorRisk, set: setErrorRisk },
                  { label: 'Affects clients directly', value: affectsClient, set: setAffectsClient },
                  { label: 'Involves money / financial data', value: involvesMoney, set: setInvolvesMoney },
                ].map(({ label, value, set }) => (
                  <label key={label} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => set(e.target.checked)}
                      className="w-4 h-4 rounded border-gold/30 bg-navy-800 text-gold focus:ring-gold/30"
                    />
                    <span className="text-white/60 text-sm">{label}</span>
                  </label>
                ))}
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
            </>
          )}

          {/* Suggested Fix (optional) */}
          <div className="flex flex-col gap-2">
            <label htmlFor="suggested_fix" className="mono-label">
              What could work better?{' '}
              <span className="text-white/30 normal-case tracking-normal text-xs ml-1">
                (optional)
              </span>
            </label>
            <textarea
              id="suggested_fix"
              value={suggestedFix}
              onChange={(e) => setSuggestedFix(e.target.value)}
              placeholder="Your idea — even a rough thought helps."
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
            disabled={loading || !department || !description.trim() || (!isQuickIdea && (!frequency || !impact))}
            className="btn-primary w-full mt-1"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Sending…
              </>
            ) : (
              'Send it'
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

// ─── Type selector icons ──────────────────────────────────────────────────────

const TYPE_CONFIG: Record<SubmissionType, { icon: React.ElementType; desc: string }> = {
  problem: { icon: AlertTriangle, desc: 'Report an inefficient process or issue' },
  suggestion: { icon: Lightbulb, desc: 'Suggest an improvement to how we work' },
  idea: { icon: Zap, desc: 'Quick idea — just a sentence or two' },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SubmitPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [submissionType, setSubmissionType] = useState<SubmissionType>('problem')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [name, setName] = useState('')
  const [department, setDepartment] = useState<Department | ''>('')
  const [description, setDescription] = useState('')
  const [processName, setProcessName] = useState('')
  const [systemUsed, setSystemUsed] = useState('')
  const [timePerOccurrence, setTimePerOccurrence] = useState('')
  const [occurrencesPerWeek, setOccurrencesPerWeek] = useState('')
  const [frustrationLevel, setFrustrationLevel] = useState<number | null>(null)
  const [errorRisk, setErrorRisk] = useState(false)
  const [affectsClient, setAffectsClient] = useState(false)
  const [involvesMoney, setInvolvesMoney] = useState(false)
  const [frequency, setFrequency] = useState<Frequency | ''>('')
  const [impact, setImpact] = useState<Impact | ''>('')
  const [suggestedFix, setSuggestedFix] = useState('')

  const isQuickIdea = submissionType === 'idea'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_type: submissionType,
          submitted_by: isAnonymous ? null : name.trim() || null,
          is_anonymous: isAnonymous,
          department,
          description: description.trim(),
          process_name: processName.trim() || null,
          system_used: systemUsed.trim() || null,
          time_per_occurrence: timePerOccurrence ? parseFloat(timePerOccurrence) : null,
          occurrences_per_week: occurrencesPerWeek ? parseFloat(occurrencesPerWeek) : null,
          frustration_level: frustrationLevel,
          error_risk: errorRisk,
          affects_client: affectsClient,
          involves_money: involvesMoney,
          frequency: isQuickIdea ? 'occasional' : frequency,
          impact: isQuickIdea ? 'medium' : impact,
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
        <p className="text-white/30 text-xs font-mono uppercase tracking-widest mb-3">Operations Intelligence Hub</p>
        <h1 className="text-2xl font-bold tracking-tight mb-3">Making Work Easier</h1>
        <p className="text-white/55 text-sm leading-relaxed">
          If something takes longer than it should, feels repetitive, or could be made simpler — feel free to share it here.
        </p>
        <p className="text-white/55 text-sm leading-relaxed mt-2">
          The aim is to reduce unnecessary steps and make day-to-day work smoother.
        </p>
        <p className="text-white/55 text-sm leading-relaxed mt-2">
          No suggestion is too small.
        </p>
      </div>

      {/* Example guidance */}
      <div className="mb-6 rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-4">
        <p className="text-white/40 text-xs font-mono uppercase tracking-widest mb-2">Examples</p>
        <ul className="text-white/50 text-sm leading-relaxed space-y-1">
          <li>• Repetitive manual tasks</li>
          <li>• Delays in getting information</li>
          <li>• Too many steps for simple tasks</li>
          <li>• Things that could be simplified or streamlined</li>
        </ul>
      </div>

      {/* Submission type selector */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {(Object.keys(TYPE_CONFIG) as SubmissionType[]).map((type) => {
          const { icon: Icon, desc } = TYPE_CONFIG[type]
          const active = submissionType === type
          return (
            <button
              key={type}
              type="button"
              onClick={() => setSubmissionType(type)}
              className={`action-btn ${active ? 'active' : ''}`}
              title={desc}
            >
              <Icon size={20} />
              <span>{SUBMISSION_TYPE_LABELS[type]}</span>
            </button>
          )
        })}
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
                    Submitting <span className="text-gold font-semibold">anonymously</span>
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
              <label htmlFor="name" className="mono-label">Your Name</label>
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
            <option value="marketing">Marketing</option>
            <option value="introducers">Introducers &amp; Partners</option>
            <option value="management">Management</option>
            <option value="other">Other</option>
          </SelectField>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label htmlFor="description" className="mono-label">
              {isQuickIdea ? "What's your idea?" : "What is slowing things down?"}
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                isQuickIdea
                  ? 'Describe your idea in a few sentences.'
                  : 'Example: We manually copy client details from emails into Excel every day, which takes time and can lead to errors.'
              }
              required
              maxLength={2000}
              className="input"
              rows={4}
            />
            <span className="text-white/25 text-xs text-right font-mono">
              {description.length}/2000
            </span>
          </div>

          {/* Extended fields (not shown for quick ideas) */}
          {!isQuickIdea && (
            <>
              {/* Process & system */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="process_name" className="mono-label">
                    Process Name <span className="text-white/30 normal-case tracking-normal text-xs ml-1">(optional)</span>
                  </label>
                  <input
                    id="process_name"
                    type="text"
                    value={processName}
                    onChange={(e) => setProcessName(e.target.value)}
                    placeholder="e.g. Client onboarding"
                    className="input"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="system_used" className="mono-label">
                    System Used <span className="text-white/30 normal-case tracking-normal text-xs ml-1">(optional)</span>
                  </label>
                  <input
                    id="system_used"
                    type="text"
                    value={systemUsed}
                    onChange={(e) => setSystemUsed(e.target.value)}
                    placeholder="e.g. Salesforce, Excel"
                    className="input"
                  />
                </div>
              </div>

              {/* Time metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="time_per" className="mono-label">
                    Time per occurrence <span className="text-white/30 normal-case tracking-normal text-xs ml-1">(mins)</span>
                  </label>
                  <input
                    id="time_per"
                    type="number"
                    min="0"
                    step="1"
                    value={timePerOccurrence}
                    onChange={(e) => setTimePerOccurrence(e.target.value)}
                    placeholder="e.g. 15"
                    className="input"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="occ_week" className="mono-label">
                    Occurrences / week
                  </label>
                  <input
                    id="occ_week"
                    type="number"
                    min="0"
                    step="1"
                    value={occurrencesPerWeek}
                    onChange={(e) => setOccurrencesPerWeek(e.target.value)}
                    placeholder="e.g. 5"
                    className="input"
                  />
                </div>
              </div>

              {/* Frustration level */}
              <div className="flex flex-col gap-2">
                <p className="mono-label">Frustration Level</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setFrustrationLevel(n)}
                      className={`action-btn flex-1 py-3 ${frustrationLevel === n ? 'active' : ''}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-white/25 text-xs font-mono">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              {/* Risk flags */}
              <div className="flex flex-col gap-3">
                <p className="mono-label">Risk Flags <span className="text-white/30 normal-case tracking-normal text-xs ml-1">(check any that apply)</span></p>
                {[
                  { label: 'Risk of errors / mistakes', value: errorRisk, set: setErrorRisk },
                  { label: 'Affects clients directly', value: affectsClient, set: setAffectsClient },
                  { label: 'Involves money / financial data', value: involvesMoney, set: setInvolvesMoney },
                ].map(({ label, value, set }) => (
                  <label key={label} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => set(e.target.checked)}
                      className="w-4 h-4 rounded border-gold/30 bg-navy-800 text-gold focus:ring-gold/30"
                    />
                    <span className="text-white/60 text-sm">{label}</span>
                  </label>
                ))}
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
            </>
          )}

          {/* Suggested Fix (optional) */}
          <div className="flex flex-col gap-2">
            <label htmlFor="suggested_fix" className="mono-label">
              What could work better?{' '}
              <span className="text-white/30 normal-case tracking-normal text-xs ml-1">
                (optional)
              </span>
            </label>
            <textarea
              id="suggested_fix"
              value={suggestedFix}
              onChange={(e) => setSuggestedFix(e.target.value)}
              placeholder="Your idea — even a rough thought helps."
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
            disabled={loading || !department || !description.trim() || (!isQuickIdea && (!frequency || !impact))}
            className="btn-primary w-full mt-1"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Submitting…
              </>
            ) : (
              isQuickIdea ? 'Submit Idea' : submissionType === 'suggestion' ? 'Submit Suggestion' : 'Submit Issue'
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
