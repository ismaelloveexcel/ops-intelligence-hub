import GlassCard from '@/components/GlassCard'
import ImpactDot from '@/components/ImpactDot'
import { supabaseAdmin } from '@/lib/supabase'
import { FeedItem, Department, DEPARTMENT_LABELS } from '@/lib/types'
import Link from 'next/link'
import { Plus, Megaphone } from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

async function getAllFeedItems(): Promise<FeedItem[]> {
  try {
    const { data } = await supabaseAdmin
      .from('public_feed')
      .select('*')
      .order('published_at', { ascending: false })
    return (data ?? []) as FeedItem[]
  } catch {
    return []
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function groupByMonth(items: FeedItem[]): Record<string, FeedItem[]> {
  return items.reduce<Record<string, FeedItem[]>>((acc, item) => {
    const key = new Date(item.published_at).toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric',
    })
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function UpdatesPage() {
  const feed = await getAllFeedItems()
  const grouped = groupByMonth(feed)
  const months = Object.keys(grouped)

  return (
    <main className="min-h-screen px-5 pt-10 pb-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <ImpactDot />
          <p className="mono-label">What we&apos;ve fixed</p>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          What we&apos;ve fixed
        </h1>
        <p className="text-white/50 text-sm leading-relaxed">
          Things that were slowing us down — and what we did about it
        </p>
      </div>

      {feed.length === 0 ? (
        <GlassCard className="py-16 text-center">
          <Megaphone size={36} className="text-gold/40 mx-auto mb-4" />
          <h2 className="text-white/60 font-semibold mb-2">Nothing here yet</h2>
          <p className="text-white/30 text-sm mb-6">
            Fixes will appear here once they&apos;re shipped.
          </p>
          <Link href="/submit" className="btn-secondary inline-flex">
            <Plus size={15} />
            Submit the first issue
          </Link>
        </GlassCard>
      ) : (
        <>
          {/* Total count */}
          <div className="flex items-center gap-3 mb-6">
            <GlassCard className="px-4 py-2.5 inline-flex items-center gap-2">
              <ImpactDot size="sm" />
              <span className="text-gold font-mono font-bold text-sm">{feed.length}</span>
              <span className="text-white/40 text-xs font-mono uppercase tracking-widest">
                fixes shipped
              </span>
            </GlassCard>
          </div>

          {/* Feed grouped by month */}
          <div className="flex flex-col gap-8">
            {months.map((month) => (
              <div key={month}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="mono-label">{month}</span>
                  <div className="flex-1 h-px bg-gold/10" />
                  <span className="text-white/25 text-xs font-mono">
                    {grouped[month].length} fix{grouped[month].length !== 1 ? 'es' : ''}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {grouped[month].map((item) => (
                    <GlassCard key={item.id} className="p-5 hover:border-gold/25 transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <ImpactDot size="sm" />
                          {/* "From the X team" — not "Department: X" */}
                          <span className="text-white/40 text-xs font-mono">
                            From the {DEPARTMENT_LABELS[item.department as Department] ?? item.department} team
                          </span>
                          {item.hours_saved != null && item.hours_saved > 0 && (
                            <span className="badge badge-new text-[10px]">
                              {item.hours_saved}h of manual work eliminated
                            </span>
                          )}
                        </div>
                        <span className="text-white/30 text-xs font-mono shrink-0">
                          {formatDate(item.published_at)}
                        </span>
                      </div>

                      <h2 className="text-white font-semibold text-base leading-snug mb-2">
                        {item.title}
                      </h2>

                      <p className="text-white/55 text-sm leading-relaxed mb-2">
                        {item.what_changed}
                      </p>

                      {(item.before_summary || item.after_summary) && (
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {item.before_summary && (
                            <div className="bg-danger/5 border border-danger/15 rounded-lg px-3 py-2">
                              <p className="text-danger/60 text-[10px] font-mono uppercase tracking-widest mb-0.5">Before</p>
                              <p className="text-white/50 text-xs">{item.before_summary}</p>
                            </div>
                          )}
                          {item.after_summary && (
                            <div className="bg-success/5 border border-success/15 rounded-lg px-3 py-2">
                              <p className="text-success/60 text-[10px] font-mono uppercase tracking-widest mb-0.5">After</p>
                              <p className="text-white/50 text-xs">{item.after_summary}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Shoutout — operator-controlled, never forced */}
                      {(item as FeedItem & { shoutout?: string | null }).shoutout && (
                        <p className="text-gold/70 text-xs mt-3">
                          🙌 Shoutout to {(item as FeedItem & { shoutout?: string | null }).shoutout} for flagging this
                        </p>
                      )}
                    </GlassCard>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-10">
            <GlassCard highlighted className="px-6 py-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-white font-semibold text-sm mb-0.5">
                  Something else needs fixing?
                </p>
                <p className="text-white/40 text-xs">No idea is too small.</p>
              </div>
              <Link href="/submit" className="btn-primary shrink-0 text-sm py-2.5 px-5">
                <Plus size={15} />
                Send it
              </Link>
            </GlassCard>
          </div>
        </>
      )}
    </main>
  )
}


// ─── Data ─────────────────────────────────────────────────────────────────────
