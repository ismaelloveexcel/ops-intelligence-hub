'use client'

import { useState } from 'react'
import GlassCard from '@/components/GlassCard'
import ImpactDot from '@/components/ImpactDot'
import Link from 'next/link'
import { ChevronLeft, Loader2, Copy, Check, FileText, ShieldAlert, Download } from 'lucide-react'

interface ReportData {
  range: string
  reportRunId: string | null
  narrativeMd: string | null
  weeklySnapshot: string
  automationSummary: string
  leadershipUpdate: string
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gold/25 bg-gold/10 text-gold text-xs font-mono hover:bg-gold/20 transition-colors"
    >
      {copied ? (
        <><Check size={12} />Copied</>
      ) : (
        <><Copy size={12} />Copy to Clipboard</>
      )}
    </button>
  )
}

export default function ReportsPage() {
  const [range, setRange] = useState('30')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [error, setError] = useState('')
  const [report, setReport] = useState<ReportData | null>(null)

  async function generateReports() {
    setError('')
    setLoading(true)

    try {
      const params = new URLSearchParams({ range })
      if (range === 'custom') {
        if (!customFrom) {
          setError('Please select a start date.')
          setLoading(false)
          return
        }
        params.set('from', customFrom)
        if (customTo) params.set('to', customTo)
      }

      const res = await fetch(`/api/admin/reports?${params.toString()}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to generate reports.')
      }

      const data: ReportData = await res.json()
      setReport(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unexpected error.')
    } finally {
      setLoading(false)
    }
  }

  async function downloadPDF() {
    setPdfLoading(true)
    try {
      const params = new URLSearchParams()
      if (report?.reportRunId) params.set('reportRunId', report.reportRunId)
      const res = await fetch(`/api/admin/pdf?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to generate PDF.')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `arie-ops-report.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'PDF download failed.')
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <main className="min-h-screen px-4 pt-10 pb-10 max-w-4xl mx-auto">
      <Link
        href="/admin/dashboard"
        className="inline-flex items-center gap-1.5 text-white/40 text-sm mb-8 hover:text-white/70 transition-colors"
      >
        <ChevronLeft size={16} />
        Dashboard
      </Link>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ImpactDot />
            <p className="mono-label">Management Reports</p>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Operations Reports</h1>
          <p className="text-white/40 text-sm mt-1">
            Generate structured updates from existing submission and pipeline data.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gold/25 bg-gold/[0.08] text-gold text-xs font-mono">
          <ShieldAlert size={13} />
          Admin only
        </div>
      </div>

      <GlassCard className="p-6 mb-8">
        <p className="mono-label mb-4">Date Range</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { value: '7', label: 'Last 7 days' },
            { value: '30', label: 'Last 30 days' },
            { value: 'custom', label: 'Custom range' },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setRange(value)}
              className={`px-4 py-2 rounded-lg border text-sm font-mono transition-colors ${
                range === value
                  ? 'border-gold/40 bg-gold/15 text-gold'
                  : 'border-white/10 bg-white/5 text-white/40 hover:border-white/20'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {range === 'custom' && (
          <div className="flex gap-3 mb-4">
            <div className="flex flex-col gap-1.5">
              <label className="mono-label text-xs">From</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="input text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="mono-label text-xs">To</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="input text-sm"
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button onClick={generateReports} disabled={loading} className="btn-primary">
            {loading ? (
              <><Loader2 size={16} className="animate-spin" />Generating…</>
            ) : (
              <><FileText size={16} />Generate Report</>
            )}
          </button>

          <button
            onClick={downloadPDF}
            disabled={pdfLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gold/30 bg-gold/10 text-gold text-sm font-medium hover:bg-gold/20 transition-colors disabled:opacity-50"
          >
            {pdfLoading ? (
              <><Loader2 size={15} className="animate-spin" />Generating PDF…</>
            ) : (
              <><Download size={15} />Download PDF</>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-danger text-sm">
            {error}
          </div>
        )}
      </GlassCard>

      {report && (
        <div className="flex flex-col gap-6">
          <p className="text-white/30 text-xs font-mono">
            Report period: {report.range}
          </p>

          {/* AI Narrative (if available) */}
          {report.narrativeMd && (
            <GlassCard className="p-6 border-gold/20">
              <div className="flex items-center justify-between mb-4">
                <p className="mono-label">Report — {report.range}</p>
                <CopyButton text={report.narrativeMd} />
              </div>
              <pre className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap font-mono bg-white/[0.03] rounded-lg p-4 border border-white/[0.06]">
                {report.narrativeMd}
              </pre>
            </GlassCard>
          )}

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="mono-label">Weekly Operations Snapshot (ASCII)</p>
              <CopyButton text={report.weeklySnapshot} />
            </div>
            <pre className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap font-mono bg-white/[0.03] rounded-lg p-4 border border-white/[0.06]">
              {report.weeklySnapshot}
            </pre>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="mono-label">Automation Pipeline Summary</p>
              <CopyButton text={report.automationSummary} />
            </div>
            <pre className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap font-mono bg-white/[0.03] rounded-lg p-4 border border-white/[0.06]">
              {report.automationSummary}
            </pre>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="mono-label">Leadership Update Draft</p>
              <CopyButton text={report.leadershipUpdate} />
            </div>
            <pre className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap font-mono bg-white/[0.03] rounded-lg p-4 border border-white/[0.06]">
              {report.leadershipUpdate}
            </pre>
          </GlassCard>
        </div>
      )}
    </main>
  )
}
