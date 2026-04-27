import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminRequest } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit-log'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authErr = await validateAdminRequest(req)
  if (authErr) return authErr

  try {
    const body = await req.json()
    const { title, description, status, visibility, kpi_area, notes } = body

    const { data, error } = await supabaseAdmin
      .from('projects')
      .update({
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(status !== undefined && { status }),
        ...(visibility !== undefined && { visibility }),
        ...(kpi_area !== undefined && { kpi_area: kpi_area || null }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Failed to update project.' }, { status: 500 })

    logAdminAction({ action: 'project_updated', entity_type: 'project', entity_id: params.id, summary: `Updated project` })
    return NextResponse.json({ project: data })
  } catch (err) {
    console.error('[PATCH /api/admin/projects/[id]]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authErr = await validateAdminRequest(req)
  if (authErr) return authErr

  const { error } = await supabaseAdmin.from('projects').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: 'Failed to delete project.' }, { status: 500 })

  logAdminAction({ action: 'project_deleted', entity_type: 'project', entity_id: params.id, summary: 'Deleted project' })
  return NextResponse.json({ success: true })
}
