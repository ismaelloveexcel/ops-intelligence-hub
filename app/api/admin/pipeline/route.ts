import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminRequest } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit-log'
import { ExecutionStatus } from '@/lib/types'

const VALID_STATUSES: ExecutionStatus[] = ['planned', 'in_progress', 'testing', 'deployed', 'cancelled']

export async function GET(req: NextRequest) {
  const authErr = validateAdminRequest(req)
  if (authErr) return authErr

  try {
    const { data, error } = await supabaseAdmin
      .from('execution_pipeline')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GET /api/admin/pipeline]', error)
      return NextResponse.json({ error: 'Failed to fetch pipeline.' }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('[GET /api/admin/pipeline]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authErr = validateAdminRequest(req)
  if (authErr) return authErr

  try {
    const body = await req.json()
    const { title, linked_submission_id, solution_type, tool_used, status, deployed_link, before_time, after_time, actual_hours_saved, notes } = body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required.' }, { status: 400 })
    }

    const pipelineStatus = status || 'planned'
    if (!VALID_STATUSES.includes(pipelineStatus)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('execution_pipeline')
      .insert({
        title: title.trim(),
        linked_submission_id: linked_submission_id || null,
        solution_type: solution_type?.trim() || null,
        tool_used: tool_used?.trim() || null,
        status: pipelineStatus,
        deployed_link: deployed_link?.trim() || null,
        before_time: before_time ?? null,
        after_time: after_time ?? null,
        actual_hours_saved: actual_hours_saved ?? null,
        notes: notes?.trim() || null,
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error('[POST /api/admin/pipeline]', error)
      return NextResponse.json({ error: 'Failed to create pipeline item.' }, { status: 500 })
    }

    // Audit log
    logAdminAction({
      action: 'pipeline_created',
      entity_type: 'pipeline',
      entity_id: data.id,
      summary: `Created: "${title.trim()}" (${pipelineStatus})`,
    })

    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/pipeline]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
