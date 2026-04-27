import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminRequest } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit-log'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authErr = await validateAdminRequest(req)
  if (authErr) return authErr

  try {
    const { title, content_md, kpi_area, is_private } = await req.json()

    const { data, error } = await supabaseAdmin
      .from('scratchpad')
      .update({
        ...(title !== undefined && { title: title.trim() }),
        ...(content_md !== undefined && { content_md: content_md?.trim() || null }),
        ...(kpi_area !== undefined && { kpi_area: kpi_area || null }),
        ...(is_private !== undefined && { is_private }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Failed to update note.' }, { status: 500 })

    logAdminAction({ action: 'note_updated', entity_type: 'note', entity_id: params.id, summary: 'Updated note' })
    return NextResponse.json({ note: data })
  } catch (err) {
    console.error('[PATCH /api/admin/notes/[id]]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authErr = await validateAdminRequest(req)
  if (authErr) return authErr

  const { error } = await supabaseAdmin.from('scratchpad').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: 'Failed to delete note.' }, { status: 500 })

  logAdminAction({ action: 'note_deleted', entity_type: 'note', entity_id: params.id, summary: 'Deleted note' })
  return NextResponse.json({ success: true })
}
