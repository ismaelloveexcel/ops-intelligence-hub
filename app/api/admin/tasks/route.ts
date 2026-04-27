import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminRequest } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authErr = await validateAdminRequest(req)
  if (authErr) return authErr

  const { data, error } = await supabaseAdmin
    .from('operator_tasks')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to load tasks.' }, { status: 500 })
  return NextResponse.json({ tasks: data ?? [] })
}

export async function POST(req: NextRequest) {
  const authErr = await validateAdminRequest(req)
  if (authErr) return authErr

  try {
    const { title, description, kpi_area, project_id, source } = await req.json()
    if (!title?.trim()) return NextResponse.json({ error: 'Title is required.' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('operator_tasks')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        kpi_area: kpi_area || null,
        project_id: project_id || null,
        source: source ?? 'self',
        status: 'todo',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Failed to create task.' }, { status: 500 })

    logAdminAction({ action: 'task_created', entity_type: 'task', entity_id: data.id, summary: `Created: ${title.trim()}` })
    return NextResponse.json({ task: data }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/tasks]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
