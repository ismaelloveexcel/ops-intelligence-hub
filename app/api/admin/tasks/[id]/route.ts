import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminRequest } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit-log'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authErr = await validateAdminRequest(req)
  if (authErr) return authErr

  try {
    const body = await req.json()
    const { title, description, status, kpi_area, project_id, source, promote_to_pipeline } = body

    const now = new Date().toISOString()
    const { data, error } = await supabaseAdmin
      .from('operator_tasks')
      .update({
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(status !== undefined && { status }),
        ...(kpi_area !== undefined && { kpi_area: kpi_area || null }),
        ...(project_id !== undefined && { project_id: project_id || null }),
        ...(source !== undefined && { source }),
        ...(promote_to_pipeline !== undefined && { promote_to_pipeline }),
        ...(status === 'done' && { completed_at: now }),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Failed to update task.' }, { status: 500 })

    logAdminAction({ action: 'task_updated', entity_type: 'task', entity_id: params.id, summary: `Status: ${status ?? 'updated'}` })
    return NextResponse.json({ task: data })
  } catch (err) {
    console.error('[PATCH /api/admin/tasks/[id]]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authErr = await validateAdminRequest(req)
  if (authErr) return authErr

  const { error } = await supabaseAdmin.from('operator_tasks').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: 'Failed to delete task.' }, { status: 500 })

  logAdminAction({ action: 'task_deleted', entity_type: 'task', entity_id: params.id, summary: 'Deleted task' })
  return NextResponse.json({ success: true })
}
