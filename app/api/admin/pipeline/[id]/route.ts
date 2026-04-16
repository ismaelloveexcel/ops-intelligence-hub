import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminRequest } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit-log'
import { ExecutionStatus, Visibility } from '@/lib/types'

const VALID_STATUSES: ExecutionStatus[] = ['planned', 'in_progress', 'testing', 'deployed', 'cancelled']
const VALID_VISIBILITIES: Visibility[] = ['private', 'public']

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authErr = await validateAdminRequest(req)
  if (authErr) return authErr

  try {
    const body = await req.json()
    const updates: Record<string, unknown> = {}
    const changes: string[] = []

    if (body.title !== undefined) { updates.title = body.title?.trim(); changes.push('title') }
    if (body.solution_type !== undefined) { updates.solution_type = body.solution_type?.trim() || null; changes.push('solution_type') }
    if (body.tool_used !== undefined) { updates.tool_used = body.tool_used?.trim() || null; changes.push('tool_used') }
    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
      }
      updates.status = body.status
      changes.push(`status → ${body.status}`)
    }
    if (body.deployed_link !== undefined) { updates.deployed_link = body.deployed_link?.trim() || null; changes.push('deployed_link') }
    if (body.before_time !== undefined) { updates.before_time = body.before_time; changes.push('before_time') }
    if (body.after_time !== undefined) { updates.after_time = body.after_time; changes.push('after_time') }
    if (body.actual_hours_saved !== undefined) { updates.actual_hours_saved = body.actual_hours_saved; changes.push('actual_hours_saved') }
    if (body.notes !== undefined) { updates.notes = body.notes?.trim() || null; changes.push('notes') }
    if (body.visibility !== undefined) {
      if (!VALID_VISIBILITIES.includes(body.visibility)) {
        return NextResponse.json({ error: 'Invalid visibility.' }, { status: 400 })
      }
      updates.visibility = body.visibility
      changes.push(`visibility → ${body.visibility}`)
    }

    if (changes.length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided for update.' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('execution_pipeline')
      .update(updates)
      .eq('id', params.id)

    if (error) {
      console.error('[PATCH /api/admin/pipeline/[id]]', error)
      return NextResponse.json({ error: 'Failed to update.' }, { status: 500 })
    }

    // Audit log
    logAdminAction({
      action: 'pipeline_updated',
      entity_type: 'pipeline',
      entity_id: params.id,
      summary: `Updated: ${changes.join(', ')}`,
    })

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
  const authErr = await validateAdminRequest(req)
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

    // Audit log
    logAdminAction({
      action: 'pipeline_deleted',
      entity_type: 'pipeline',
      entity_id: params.id,
      summary: 'Pipeline item deleted',
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/admin/pipeline/[id]]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
