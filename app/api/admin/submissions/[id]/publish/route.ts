import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// ─── POST — publish submission to the public feed ────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { title, what_changed } = body

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
    })

    if (feedError) {
      console.error('[POST publish] feed_items insert:', feedError)
      return NextResponse.json({ error: 'Failed to publish to feed.' }, { status: 500 })
    }

    // Mark review_actions.published_to_feed = true (upsert to handle missing row)
    await supabaseAdmin
      .from('review_actions')
      .upsert(
        {
          submission_id: params.id,
          published_to_feed: true,
          reviewed_at: new Date().toISOString(),
        },
        { onConflict: 'submission_id' }
      )

    // Update submission status to 'implemented'
    await supabaseAdmin
      .from('submissions')
      .update({ status: 'implemented' })
      .eq('id', params.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/admin/submissions/[id]/publish]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
