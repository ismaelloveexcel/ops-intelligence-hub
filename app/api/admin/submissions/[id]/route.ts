import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { SubmissionStatus } from '@/lib/types'
import { validateAdminRequest } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit-log'

const VALID_STATUSES: SubmissionStatus[] = [
  'new', 'reviewing', 'accepted', 'in_progress', 'rejected', 'implemented',
]

// ─── GET — fetch full admin_board row ────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authErr = validateAdminRequest(req)
  if (authErr) return authErr

  try {
    const { data, error } = await supabaseAdmin
      .from('admin_board')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Submission not found.' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[GET /api/admin/submissions/[id]]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

// ─── PATCH — upsert review_actions + optionally update submission status ─────

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authErr = validateAdminRequest(req)
  if (authErr) return authErr

  try {
    const body = await req.json()

    const {
      action_type,
      priority,
      ease,
      owner,
      target_date,
      time_wasted_hrs,
      admin_notes,
      status,
      automation_potential,
      implementation_effort,
      review_category,
      impact_level,
      estimated_hours_saved_monthly,
    } = body

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
    }

    if (automation_potential != null && (automation_potential < 1 || automation_potential > 5)) {
      return NextResponse.json({ error: 'Automation potential must be 1–5.' }, { status: 400 })
    }

    // Upsert review_actions (conflict on submission_id)
    const { error: reviewError } = await supabaseAdmin
      .from('review_actions')
      .upsert(
        {
          submission_id: params.id,
          action_type: action_type ?? null,
          priority: priority ?? null,
          ease: ease ?? null,
          owner: owner ?? null,
          target_date: target_date ?? null,
          time_wasted_hrs: time_wasted_hrs ?? null,
          admin_notes: admin_notes ?? null,
          reviewed_at: new Date().toISOString(),
          automation_potential: automation_potential ?? null,
          implementation_effort: implementation_effort ?? null,
          review_category: review_category ?? null,
          impact_level: impact_level ?? null,
          estimated_hours_saved_monthly: estimated_hours_saved_monthly ?? null,
        },
        { onConflict: 'submission_id' }
      )

    if (reviewError) {
      console.error('[PATCH review_actions]', reviewError)
      return NextResponse.json({ error: 'Failed to save review.' }, { status: 500 })
    }

    // Update submission status if provided
    if (status) {
      const { error: statusError } = await supabaseAdmin
        .from('submissions')
        .update({ status })
        .eq('id', params.id)

      if (statusError) {
        console.error('[PATCH submissions.status]', statusError)
        return NextResponse.json({ error: 'Failed to update status.' }, { status: 500 })
      }
    }

    // Audit log
    logAdminAction({
      action: 'review_saved',
      entity_type: 'submission',
      entity_id: params.id,
      summary: `Review saved${status ? ` — status → ${status}` : ''}${action_type ? ` — action: ${action_type}` : ''}`,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PATCH /api/admin/submissions/[id]]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
