'use client'

import { useState, useEffect } from 'react'
import GlassCard from '@/components/GlassCard'
import ImpactDot from '@/components/ImpactDot'
import Link from 'next/link'
import { ChevronLeft, Loader2, Zap, Save, ArrowRight, RotateCcw, BookOpen, ShieldAlert, History } from 'lucide-react'

interface LabSession {
  id: string
  input_text: string
  ai_output: string | null
  automation_score: number | null
  kpi_area: string | null
  created_at: string
  saved_to_notes: boolean
  promoted_to_pipeline: boolean
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 7 ? 'text-success border-success/30 bg-success/10' : score >= 4 ? 'text-gold border-gold/30 bg-gold/10' : 'text-white/40 border-white/10'
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded border ${color}`}>
      <Zap size={10} />{score}/10
    </span>
  )
}

function formatOutput(text: string) {
  const sections = text.split('\n\n')
  return sections.map((section, i) => {
    const lines = section.split('\n')
    const heading = lines[0]
    const isHeading = heading.match(/^[A-Z][A-Z\s\/]+:/)
    return (
      <div key={i} className="mb-4">
        {isHeading ? (
          <>
            <p className="text-gold font-mono font-bold text-sm mb-2">{heading}</p>
            {lines.slice(1).map((line, j) => (
              <p key={j} className={`text-sm leading-relaxed ${line.startsWith('•') || line.match(/^\d+\./) ? 'text-white/70 ml-2' : 'text-white/60'}`}>
                {line}
              </p>
            ))}
          </>
        ) : (
          lines.map((line, j) => (
            <p key={j} className="text-white/60 text-sm leading-relaxed">{line}</p>
          ))
        )}
      </div>
    )
  })
}

export default function LabPage() {
  const [input, setInput] = useState('')
  const [analysing, setAnalysing] = useState(false)
  const [output, setOutput] = useState<string | null>(null)
  const [score, setScore] = useState<number | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [sessions, setSessions] = useState<LabSession[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [actionMsg, setActionMsg] = useState('')

  useEffect(() => {
    fetch('/api/admin/lab')
      .then((r) => r.json())
      .then((d) => { setSessions(d.sessions ?? []); setLoadingSessions(false) })
      .catch(() => setLoadingSessions(false))
  }, [])

  async function analyse() {
    if (!input.trim() || input.trim().length < 10) return
    setAnalysing(true)
    setError('')
    setOutput(null)
    setScore(null)
    setSessionId(null)

    try {
      const res = await fetch('/api/admin/lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_text: input.trim() }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'Analysis failed.')
      setOutput(d.aiOutput)
      setScore(d.automationScore)
      setSessionId(d.sessionId)
      // Add to session list
      if (d.sessionId) {
        setSessions((prev) => [{
          id: d.sessionId,
          input_text: input.trim(),
          ai_output: d.aiOutput,
          automation_score: d.automationScore,
          kpi_area: null,
          created_at: new Date().toISOString(),
          saved_to_notes: false,
          promoted_to_pipeline: false,
        }, ...prev])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed.')
    } finally {
      setAnalysing(false)
    }
  }

  async function doAction(action: 'save_to_notes' | 'promote_to_pipeline') {
    if (!sessionId) return
    setActionMsg('')
    try {
      const res = await fetch(`/api/admin/lab/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error('Action failed.')
      const label = action === 'save_to_notes' ? 'Saved to notes' : 'Added to pipeline'
      setActionMsg(label)
      setTimeout(() => setActionMsg(''), 3000)
    } catch {
      setActionMsg('Action failed.')
    }
  }

  function loadSession(s: LabSession) {
    setInput(s.input_text)
    setOutput(s.ai_output)
    setScore(s.automation_score)
    setSessionId(s.id)
    setError('')
  }

  function clearPanel() {
    setInput('')
    setOutput(null)
    setScore(null)
    setSessionId(null)
    setError('')
  }

  return (
    <main className="min-h-screen px-4 pt-10 pb-10 max-w-6xl mx-auto">
      <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-white/40 text-sm mb-8 hover:text-white/70 transition-colors">
        <ChevronLeft size={16} />Dashboard
      </Link>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1"><ImpactDot /><p className="mono-label">Automation Lab</p></div>
          <h1 className="text-2xl font-bold tracking-tight">Automation Lab</h1>
          <p className="text-white/40 text-sm mt-1">Describe any process — I&apos;ll tell you exactly how to automate it</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gold/25 bg-gold/[0.08] text-gold text-xs font-mono">
          <ShieldAlert size={13} />Admin only
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* LEFT — Input */}
        <div className="flex flex-col gap-4">
          <GlassCard className="p-5">
            <p className="mono-label mb-3">Process description</p>
            <textarea
              className="input w-full"
              rows={10}
              placeholder="Describe the process like you're explaining it to a colleague — who does it, how often, what steps, what tools are used, and what the pain is"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={analysing}
            />
            <div className="flex gap-2 mt-3 flex-wrap">
              <button
                onClick={analyse}
                disabled={analysing || !input.trim() || input.trim().length < 10}
                className="btn-primary"
              >
                {analysing ? (
                  <><Loader2 size={15} className="animate-spin" />Analysing…</>
                ) : (
                  <><Zap size={15} />Analyse</>
                )}
              </button>
              <button onClick={clearPanel} className="btn-secondary text-sm">
                <RotateCcw size={13} />New analysis
              </button>
            </div>
            {error && <p className="text-danger text-sm mt-2">{error}</p>}
          </GlassCard>
        </div>

        {/* RIGHT — Output */}
        <div>
          {output ? (
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="mono-label">Analysis</p>
                {score != null && <ScoreBadge score={score} />}
              </div>
              <div className="prose prose-invert max-w-none mb-4">
                {formatOutput(output)}
              </div>
              {actionMsg && <p className="text-success text-xs mb-3 font-mono">{actionMsg}</p>}
              <div className="flex gap-2 flex-wrap border-t border-white/[0.06] pt-3 mt-3">
                <button onClick={() => doAction('save_to_notes')} className="btn-secondary text-sm">
                  <Save size={13} />Save to notes
                </button>
                <button onClick={() => doAction('promote_to_pipeline')} className="btn-secondary text-sm">
                  <ArrowRight size={13} />Add to pipeline
                </button>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
              <Zap size={28} className="text-gold/30 mb-3" />
              <p className="text-white/25 text-sm">
                Paste in any process — manual, repetitive, or just inefficient — and see what&apos;s possible
              </p>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Session history */}
      {sessions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <History size={13} className="text-white/30" />
            <p className="mono-label">Recent analyses</p>
          </div>
          <div className="flex flex-col gap-2">
            {loadingSessions ? (
              <div className="flex items-center gap-2 text-white/30"><Loader2 size={13} className="animate-spin" />Loading…</div>
            ) : (
              sessions.slice(0, 10).map((s) => (
                <div
                  key={s.id}
                  className="cursor-pointer"
                  onClick={() => loadSession(s)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && loadSession(s)}
                >
                  <GlassCard className="px-4 py-3 hover:border-white/15 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-white/50 text-sm truncate flex-1">
                      {s.input_text.slice(0, 80)}{s.input_text.length > 80 ? '…' : ''}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      {s.automation_score != null && <ScoreBadge score={s.automation_score} />}
                      <span className="text-white/20 text-xs font-mono">
                        {new Date(s.created_at).toLocaleDateString('en-GB')}
                      </span>
                      {s.saved_to_notes && <BookOpen size={11} className="text-gold/40" />}
                    </div>
                  </div>
                </GlassCard>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </main>
  )
}
