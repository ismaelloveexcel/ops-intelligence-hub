'use client'

import { useState, useEffect } from 'react'
import GlassCard from '@/components/GlassCard'
import ImpactDot from '@/components/ImpactDot'
import Link from 'next/link'
import { ChevronLeft, Loader2, Send, X, Mail, CheckCircle2, ShieldAlert } from 'lucide-react'

interface NotificationItem {
  submissionId: string
  pipelineId: string | null
  submitterEmail: string
  processName: string
  status: string
  department: string
  draft: { subject: string; body: string }
}

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [sending, setSending] = useState<Record<string, boolean>>({})
  const [sent, setSent] = useState<Set<string>>(new Set())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [editedBodies, setEditedBodies] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/admin/notifications')
      .then((r) => r.json())
      .then((d) => {
        setNotifications(d.notifications ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSend(item: NotificationItem) {
    setSending((p) => ({ ...p, [item.submissionId]: true }))
    setErrors((p) => { const n = { ...p }; delete n[item.submissionId]; return n })

    try {
      const body = editedBodies[item.submissionId] ?? item.draft.body
      const res = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: item.submissionId,
          subject: item.draft.subject,
          body,
          submitterEmail: item.submitterEmail,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Send failed')
      }
      setSent((p) => new Set([...p, item.submissionId]))
    } catch (err) {
      setErrors((p) => ({
        ...p,
        [item.submissionId]: err instanceof Error ? err.message : 'Send failed',
      }))
    } finally {
      setSending((p) => ({ ...p, [item.submissionId]: false }))
    }
  }

  const visible = notifications.filter(
    (n) => !dismissed.has(n.submissionId) && !sent.has(n.submissionId)
  )

  return (
    <main className="min-h-screen px-4 pt-10 pb-10 max-w-3xl mx-auto">
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
            <p className="mono-label">Notifications</p>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Pending Acknowledgements</h1>
          <p className="text-white/40 text-sm mt-1">
            Submitters who left their email and are waiting to hear back.
          </p>
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
      ) : visible.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <CheckCircle2 size={28} className="text-success mx-auto mb-3" />
          <p className="text-white/55 text-sm">
            Nothing to send right now. Good place to be.
          </p>
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-5">
          {visible.map((item) => {
            const body = editedBodies[item.submissionId] ?? item.draft.body
            const isSending = sending[item.submissionId]
            const sendError = errors[item.submissionId]

            return (
              <GlassCard key={item.submissionId} className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-white/80 text-sm font-medium mb-1">{item.processName}</p>
                    <div className="flex items-center gap-3 text-xs font-mono text-white/35">
                      <span className="capitalize">{item.status}</span>
                      <span>·</span>
                      <span>{item.department}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Mail size={10} />
                        {item.submitterEmail}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDismissed((p) => new Set([...p, item.submissionId]))}
                    className="text-white/25 hover:text-white/55 transition-colors"
                    title="Dismiss"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Subject */}
                <div className="mb-3">
                  <p className="text-white/30 text-[10px] font-mono uppercase tracking-widest mb-1">
                    Subject
                  </p>
                  <p className="text-white/60 text-sm">{item.draft.subject}</p>
                </div>

                {/* Body — editable */}
                <div className="mb-4">
                  <p className="text-white/30 text-[10px] font-mono uppercase tracking-widest mb-1">
                    Email body (editable)
                  </p>
                  <textarea
                    value={body}
                    onChange={(e) =>
                      setEditedBodies((p) => ({
                        ...p,
                        [item.submissionId]: e.target.value,
                      }))
                    }
                    className="input text-sm w-full"
                    rows={4}
                  />
                </div>

                {sendError && (
                  <p className="text-danger text-xs mb-3">{sendError}</p>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleSend(item)}
                    disabled={isSending}
                    className="btn-primary text-sm py-2"
                  >
                    {isSending ? (
                      <><Loader2 size={14} className="animate-spin" /> Sending…</>
                    ) : (
                      <><Send size={14} /> Send</>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDismissed((p) => new Set([...p, item.submissionId]))}
                    className="btn-secondary text-sm py-2"
                  >
                    Dismiss
                  </button>
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}

      {sent.size > 0 && (
        <div className="mt-6">
          <p className="text-white/30 text-xs font-mono mb-3 uppercase tracking-widest">
            Sent this session
          </p>
          {notifications
            .filter((n) => sent.has(n.submissionId))
            .map((n) => (
              <div key={n.submissionId} className="flex items-center gap-2 text-success text-sm py-1.5">
                <CheckCircle2 size={13} />
                Sent to {n.submitterEmail} — {n.processName}
              </div>
            ))}
        </div>
      )}
    </main>
  )
}
