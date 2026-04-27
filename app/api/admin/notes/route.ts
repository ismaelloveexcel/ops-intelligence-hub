import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminRequest } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authErr = await validateAdminRequest(req)
  if (authErr) return authErr

  const { data, error } = await supabaseAdmin
    .from('scratchpad')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to load notes.' }, { status: 500 })
  return NextResponse.json({ notes: data ?? [] })
}

export async function POST(req: NextRequest) {
  const authErr = await validateAdminRequest(req)
  if (authErr) return authErr

  try {
    const { title, content_md, kpi_area, is_private } = await req.json()
    if (!title?.trim()) return NextResponse.json({ error: 'Title is required.' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('scratchpad')
      .insert({
        title: title.trim(),
        content_md: content_md?.trim() || null,
        kpi_area: kpi_area || null,
        is_private: is_private ?? true,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Failed to create note.' }, { status: 500 })

    logAdminAction({ action: 'note_created', entity_type: 'note', entity_id: data.id, summary: `Created: ${title.trim()}` })
    return NextResponse.json({ note: data }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/notes]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
