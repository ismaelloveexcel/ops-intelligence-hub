import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminRequest } from '@/lib/admin-auth'
import { ExecutionStatus } from '@/lib/types'

const VALID_STATUSES: ExecutionStatus[] = ['planned', 'in_progress', 'testing', 'deployed', 'cancelled']

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authErr = validateAdminRequest(req)
  if (authErr) return authErr

  try {
    const body = await req.json()
    const updates: Record<string, unknown> = {}

    if (body.title !== undefined) updates.title = body.title?.trim()
    if (body.solution_type !== undefined) updates.solution_type = body.solution_type?.trim() || null
    if (body.tool_used !== undefined) updates.tool_used = body.tool_used?.trim() || null
    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
      }
      updates.status = body.status
    }
    if (body.deployed_link !== undefined) updates.deployed_link = body.deployed_link?.trim() || null
    if (body.before_time !== undefined) updates.before_time = body.before_time
    if (body.after_time !== undefined) updates.after_time = body.after_time
    if (body.actual_hours_saved !== undefined) updates.actual_hours_saved = body.actual_hours_saved
    if (body.notes !== undefined) updates.notes = body.notes?.trim() || null

    const { error } = await supabaseAdmin
      .from('execution_pipeline')
      .update(updates)
      .eq('id', params.id)

    if (error) {
      console.error('[PATCH /api/admin/pipeline/[id]]', error)
      return NextResponse.json({ error: 'Failed to update.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PATCH /api/admin/pipeline/[id]]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authErr = validateAdminRequest(req)
  if (authErr) return authErr

  try {
    const { error } = await supabaseAdmin
      .from('execution_pipeline')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('[DELETE /api/admin/pipeline/[id]]', error)
      return NextResponse.json({ error: 'Failed to delete.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/admin/pipeline/[id]]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
