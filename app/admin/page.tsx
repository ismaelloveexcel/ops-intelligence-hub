import ImpactDot from '@/components/ImpactDot'
import { supabaseAdmin } from '@/lib/supabase'
import { AdminBoardRow } from '@/lib/types'
import { ShieldAlert } from 'lucide-react'
import AdminBoard from './AdminBoard'

export const dynamic = 'force-dynamic'

// ─── Data ─────────────────────────────────────────────────────────────────────

async function getAdminBoard(): Promise<AdminBoardRow[]> {
  try {
    const { data } = await supabaseAdmin
      .from('admin_board')
      .select('*')
      .order('created_at', { ascending: false })
    return (data ?? []) as AdminBoardRow[]
  } catch {
    return []
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  const rows = await getAdminBoard()

  return (
    <main className="min-h-screen px-4 pt-10 pb-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ImpactDot />
            <p className="mono-label">Admin</p>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Triage Board</h1>
          <p className="text-white/40 text-sm mt-1">
            {rows.length} total submission{rows.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gold/25 bg-gold/[0.08] text-gold text-xs font-mono">
          <ShieldAlert size={13} />
          Admin only
        </div>
      </div>

      <AdminBoard rows={rows} />
    </main>
  )
}
