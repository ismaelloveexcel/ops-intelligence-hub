'use client'

import { useState, useEffect } from 'react'
import GlassCard from '@/components/GlassCard'
import ImpactDot from '@/components/ImpactDot'
import Link from 'next/link'
import { ChevronLeft, Loader2, Save, CheckCircle2, ShieldAlert, Mail } from 'lucide-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [saveError, setSaveError] = useState('')

  const [resendFrom, setResendFrom] = useState('noreply@placeholder.com')

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.config?.resend_from) setResendFrom(d.config.resend_from)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaveMsg('')
    setSaveError('')

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'resend_from', value: resendFrom.trim() }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Save failed')
      }
      setSaveMsg('Saved')
      setTimeout(() => setSaveMsg(''), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen px-4 pt-10 pb-10 max-w-2xl mx-auto">
      <Link
        href="/admin/dashboard"
        className="inline-flex items-center gap-1.5 text-white/40 text-sm mb-8 hover:text-white/70 transition-colors"
      >
        <ChevronLeft size={16} />
        Dashboard
      </Link>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ImpactDot />
            <p className="mono-label">Settings</p>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-white/40 text-sm mt-1">System configuration for the Operations Intelligence Hub.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gold/25 bg-gold/[0.08] text-gold text-xs font-mono">
          <ShieldAlert size={13} />
          Admin only
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-white/40">
          <Loader2 size={16} className="animate-spin" />
          Loading…
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Email sending domain */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Mail size={14} className="text-gold/60" />
              <p className="mono-label">Email Sending Domain</p>
            </div>

            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] mb-4">
              <p className="text-white/50 text-sm leading-relaxed">
                Email sending domain: <span className="text-gold font-mono">{resendFrom}</span>
              </p>
              <p className="text-white/30 text-xs mt-2">
                Update this when your Arie Finance email is confirmed.
              </p>
            </div>

            <div className="flex flex-col gap-2 mb-4">
              <label htmlFor="resend-from" className="mono-label">From email address</label>
              <input
                id="resend-from"
                type="email"
                value={resendFrom}
                onChange={(e) => setResendFrom(e.target.value)}
                placeholder="noreply@ariefinance.com"
                className="input"
              />
            </div>

            {saveError && (
              <p className="text-danger text-xs mb-3">{saveError}</p>
            )}
            {saveMsg && (
              <div className="flex items-center gap-2 text-success text-sm mb-3">
                <CheckCircle2 size={13} />
                {saveMsg}
              </div>
            )}

            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
              {saving ? (
                <><Loader2 size={14} className="animate-spin" /> Saving…</>
              ) : (
                <><Save size={14} /> Save</>
              )}
            </button>
          </GlassCard>

          {/* Deferred config notes */}
          <GlassCard className="p-6 border-white/[0.06]">
            <p className="mono-label mb-3">Deferred Configuration</p>
            <div className="space-y-3 text-sm text-white/50">
              <div className="flex gap-3">
                <span className="text-white/20 font-mono">—</span>
                <span><strong className="text-white/60">Report recipients</strong> — will be populated when you join. Update <code className="text-gold text-xs">app_config.report_recipients</code>.</span>
              </div>
              <div className="flex gap-3">
                <span className="text-white/20 font-mono">—</span>
                <span><strong className="text-white/60">Email domain</strong> — update the from address above when the Arie Finance domain is verified in Resend.</span>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </main>
  )
}
