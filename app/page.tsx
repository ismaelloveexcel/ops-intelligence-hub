import Link from 'next/link'
import GlassCard from '@/components/GlassCard'
import { DeptBadge } from '@/components/StatusBadge'
import ImpactDot from '@/components/ImpactDot'
import { supabaseAdmin } from '@/lib/supabase'
import { FeedItem, Department } from '@/lib/types'
import { ArrowRight, Plus, CheckCircle, Clock, Zap } from 'lucide-react'

// ─── Data Fetching ────────────────────────────────────────────────────────────

async function getStats() {
  try {
    const [total, fixed, inProgress, hours] = await Promise.all([
      supabaseAdmin.from('submissions').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'implemented'),
      supabaseAdmin.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
      supabaseAdmin.from('review_actions').select('time_wasted_hrs').eq('published_to_feed', true),
    ])
    const hoursSaved = (hours.data ?? []).reduce(
      (sum: number, r: { time_wasted_hrs: number | null }) => sum + (r.time_wasted_hrs ?? 0),
      0
    )
    return {
      total: total.count ?? 0,
      fixed: fixed.count ?? 0,
      inProgress: inProgress.count ?? 0,
      hoursSaved: Math.round(hoursSaved),
    }
  } catch {
    return { total: 0, fixed: 0, inProgress: 0, hoursSaved: 0 }
  }
}

async function getRecentFeed(): Promise<FeedItem[]> {
  try {
    const { data } = await supabaseAdmin
      .from('public_feed')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(5)
    return (data ?? []) as FeedItem[]
  } catch {
    return []
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return `${Math.floor(days / 30)} months ago`
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [stats, feed] = await Promise.all([getStats(), getRecentFeed()])

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="px-5 pt-12 pb-8 max-w-2xl mx-auto">
        <p className="mono-label mb-3">Operations Intelligence Hub</p>
        <h1 className="text-3xl font-bold tracking-tight leading-tight mb-3">
          From Feedback{' '}
          <span className="teal-gradient-text">to Action.</span>
        </h1>
        <p className="text-white/55 text-base leading-relaxed max-w-sm">
          A living record of operational improvements — driven by your submissions.
        </p>
      </section>

      {/* Stats Row */}
      <section className="px-5 mb-8 max-w-2xl mx-auto">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Zap, value: stats.total, label: 'Submitted' },
            { icon: CheckCircle, value: stats.fixed, label: 'Fixed' },
            { icon: Clock, value: stats.inProgress, label: 'In Progress' },
            { icon: Zap, value: `${stats.hoursSaved}h`, label: 'Hours Saved' },
          ].map(({ icon: Icon, value, label }) => (
            <GlassCard key={label} className="stat-card">
              <div className="flex items-center justify-center gap-1 mb-1">
                <ImpactDot size="sm" />
              </div>
              <div className="stat-number">{value}</div>
              <div className="stat-label">{label}</div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Recent Feed */}
      <section className="px-5 mb-10 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="mono-label">Recent Fixes</p>
          <Link
            href="/updates"
            className="text-teal text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        <GlassCard className="overflow-hidden p-0">
          {feed.length === 0 ? (
            <div className="px-6 py-10 text-center text-white/35 text-sm">
              No fixes published yet — check back soon.
            </div>
          ) : (
            feed.map((item) => (
              <div key={item.id} className="feed-item">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <ImpactDot size="sm" />
                    <DeptBadge department={item.department as Department} size="sm" />
                    {item.hours_saved != null && item.hours_saved > 0 && (
                      <span className="badge badge-new text-[10px]">
                        {item.hours_saved}h saved
                      </span>
                    )}
                  </div>
                  <span className="text-white/30 text-xs font-mono shrink-0">
                    {timeAgo(item.published_at)}
                  </span>
                </div>
                <h3 className="text-white font-semibold text-sm leading-snug mb-1">
                  {item.title}
                </h3>
                <p className="text-teal/50 text-[10px] font-mono uppercase tracking-widest mb-0.5">Action Taken</p>
                <p className="text-white/50 text-sm leading-relaxed line-clamp-2">
                  {item.what_changed}
                </p>
              </div>
            ))
          )}
        </GlassCard>
      </section>

      {/* Submit CTA — Desktop */}
      <section className="hidden sm:block px-5 pb-12 max-w-2xl mx-auto">
        <GlassCard highlighted className="flex items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-white font-semibold mb-0.5">Got a suggestion or pain point?</p>
            <p className="text-white/50 text-sm">It takes 60 seconds. Anonymous submissions welcome.</p>
          </div>
          <Link href="/submit" className="btn-primary shrink-0">
            <Plus size={16} />
            Improve Our Work
          </Link>
        </GlassCard>
      </section>

      {/* Floating CTA — Mobile */}
      <div className="sm:hidden fixed bottom-20 right-5 z-50">
        <Link
          href="/submit"
          className="btn-primary rounded-full w-14 h-14 p-0 shadow-teal-glow"
          aria-label="Report an issue"
        >
          <Plus size={22} />
        </Link>
      </div>
    </main>
  )
}
