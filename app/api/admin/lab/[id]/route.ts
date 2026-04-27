import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminRequest } from '@/lib/admin-auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authErr = await validateAdminRequest(req)
  if (authErr) return authErr

  try {
    const { action } = await req.json()

    // Load session
    const { data: session, error: loadErr } = await supabaseAdmin
      .from('lab_sessions')
      .select('*')
      .eq('id', params.id)
      .single()

    if (loadErr || !session) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 })
    }

    if (action === 'save_to_notes') {
      const title = `Lab Analysis — ${new Date(session.created_at as string).toLocaleDateString('en-GB')}`
      const content = `## Process\n\n${session.input_text}\n\n## Analysis\n\n${session.ai_output}`

      const { data: note } = await supabaseAdmin
        .from('scratchpad')
        .insert({ title, content_md: content, kpi_area: session.kpi_area, is_private: true })
        .select()
        .single()

      await supabaseAdmin.from('lab_sessions').update({ saved_to_notes: true }).eq('id', params.id)

      return NextResponse.json({ note })
    }

    if (action === 'promote_to_pipeline') {
      const title = (session.input_text as string).slice(0, 80)
      const { data: pipeline } = await supabaseAdmin
        .from('execution_pipeline')
        .insert({
          title: `[Lab] ${title}`,
          description: session.ai_output,
          kpi_area: session.kpi_area,
          status: 'planned',
        })
        .select()
        .single()

      await supabaseAdmin.from('lab_sessions').update({ promoted_to_pipeline: true }).eq('id', params.id)

      return NextResponse.json({ pipeline })
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
  } catch (err) {
    console.error('[POST /api/admin/lab/[id]]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
