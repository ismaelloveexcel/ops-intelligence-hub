import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { AdminBoardRow } from '@/lib/types'
import { ChevronLeft } from 'lucide-react'
import ReviewForm from './ReviewForm'

// ─── Data ─────────────────────────────────────────────────────────────────────

async function getSubmission(id: string): Promise<AdminBoardRow | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_board')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !data) return null
    return data as AdminBoardRow
  } catch {
    return null
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminReviewPage({
  params,
}: {
  params: { id: string }
}) {
  const row = await getSubmission(params.id)
  if (!row) notFound()

  return (
    <main className="min-h-screen px-5 pt-10 pb-10 max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-white/40 text-sm mb-8 hover:text-white/70 transition-colors"
      >
        <ChevronLeft size={16} />
        Back to Triage Board
      </Link>

      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">
          Review Submission
        </h1>
        <p className="text-white/35 text-xs font-mono mt-1">
          ID: {row.id.slice(0, 8).toUpperCase()}
        </p>
      </div>

      {/* Client-side interactive form */}
      <ReviewForm row={row} />
    </main>
  )
}
