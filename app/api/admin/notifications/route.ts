import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminRequest } from '@/lib/admin-auth'
import { generateAckDraft } from '@/lib/ai/ack'

export const dynamic = 'force-dynamic'

/**
 * GET — list submissions with submitter_email that are accepted/implemented
 * but haven't been notified yet. Returns AI-drafted ack previews.
 */
export async function GET(req: NextRequest) {
  const authErr = await validateAdminRequest(req)
  if (authErr) return authErr

  try {
    const { data, error } = await supabaseAdmin
      .from('submissions')
      .select(`
        id,
        process_name,
        description,
        department,
        status,
        submitter_email,
        execution_pipeline (
          id,
          submitter_notified_at,
          actual_hours_saved
        )
      `)
      .in('status', ['accepted', 'implemented'])
      .not('submitter_email', 'is', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GET /api/admin/notifications]', error)
      return NextResponse.json({ error: 'Failed to load notifications.' }, { status: 500 })
    }

    // Filter out already-notified items
    const pending = (data ?? []).filter((row) => {
      const pipeline = Array.isArray(row.execution_pipeline)
        ? row.execution_pipeline[0]
        : row.execution_pipeline
      return !pipeline?.submitter_notified_at
    })

    // Generate AI draft previews
    const notifications = await Promise.all(
      pending.slice(0, 20).map(async (row) => {
        const processName = row.process_name || row.description?.slice(0, 60) || 'your submission'
        const statusLabel = row.status === 'implemented' ? 'implemented' : 'accepted'
        const pipeline = Array.isArray(row.execution_pipeline)
          ? row.execution_pipeline[0]
          : row.execution_pipeline
        const hoursSaved = pipeline?.actual_hours_saved ?? null

        const draft = await generateAckDraft(processName, statusLabel, hoursSaved)

        return {
          submissionId: row.id,
          pipelineId: pipeline?.id ?? null,
          submitterEmail: row.submitter_email,
          processName,
          status: row.status,
          department: row.department,
          draft: draft ?? {
            subject: `Update on your suggestion — ${processName}`,
            body: `Hi, your suggestion about "${processName}" has been ${statusLabel}. Thank you for flagging it. — Ismael`,
          },
        }
      })
    )

    return NextResponse.json({ notifications })
  } catch (err) {
    console.error('[GET /api/admin/notifications]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
