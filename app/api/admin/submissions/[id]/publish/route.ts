import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminRequest } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit-log'

// ─── POST — publish submission to the public feed ────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authErr = validateAdminRequest(req)
  if (authErr) return authErr

  try {
    const body = await req.json()
    const { title, what_changed, hours_saved, before_summary, after_summary } = body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required.' }, { status: 400 })
    }
    if (!what_changed || typeof what_changed !== 'string' || what_changed.trim().length === 0) {
      return NextResponse.json({ error: 'What changed is required.' }, { status: 400 })
    }

    // Fetch the submission to get department
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from('submissions')
      .select('department')
      .eq('id', params.id)
      .single()

    if (fetchError || !submission) {
      return NextResponse.json({ error: 'Submission not found.' }, { status: 404 })
    }

    // Insert feed item
    const { error: feedError } = await supabaseAdmin.from('feed_items').insert({
      submission_id: params.id,
      title: title.trim(),
      what_changed: what_changed.trim(),
      department: submission.department,
      published_at: new Date().toISOString(),
      hours_saved: hours_saved ?? null,
      before_summary: before_summary?.trim() || null,
      after_summary: after_summary?.trim() || null,
    })

    if (feedError) {
      console.error('[POST publish] feed_items insert:', feedError)
      return NextResponse.json({ error: 'Failed to publish to feed.' }, { status: 500 })
    }

    // Mark review_actions.published_to_feed = true
    const { error: reviewErr } = await supabaseAdmin
      .from('review_actions')
      .upsert(
        {
          submission_id: params.id,
          published_to_feed: true,
          reviewed_at: new Date().toISOString(),
        },
        { onConflict: 'submission_id' }
      )

    if (reviewErr) {
      console.error('[POST publish] review_actions upsert:', reviewErr)
      // Non-fatal — feed item already written
    }

    // Update submission status to 'implemented'
    const { error: statusErr } = await supabaseAdmin
      .from('submissions')
      .update({ status: 'implemented' })
      .eq('id', params.id)

    if (statusErr) {
      console.error('[POST publish] status update:', statusErr)
    }

    // Audit log
    logAdminAction({
      action: 'submission_published',
      entity_type: 'submission',
      entity_id: params.id,
      summary: `Published to feed: "${title.trim()}"`,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/admin/submissions/[id]/publish]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
