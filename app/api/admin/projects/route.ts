import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminRequest } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authErr = await validateAdminRequest(req)
  if (authErr) return authErr

  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to load projects.' }, { status: 500 })
  return NextResponse.json({ projects: data ?? [] })
}

export async function POST(req: NextRequest) {
  const authErr = await validateAdminRequest(req)
  if (authErr) return authErr

  try {
    const { title, description, kpi_area, notes, visibility } = await req.json()
    if (!title?.trim()) return NextResponse.json({ error: 'Title is required.' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert({ title: title.trim(), description: description?.trim() || null, kpi_area: kpi_area || null, notes: notes?.trim() || null, visibility: visibility ?? 'private' })
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Failed to create project.' }, { status: 500 })

    logAdminAction({ action: 'project_created', entity_type: 'project', entity_id: data.id, summary: `Created: ${title.trim()}` })
    return NextResponse.json({ project: data }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/projects]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
