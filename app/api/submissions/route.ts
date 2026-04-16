import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { notifyNewSubmission } from '@/lib/notify'
import { Department, Frequency, Impact, SubmissionType } from '@/lib/types'
import { checkRateLimit } from '@/lib/rate-limit'

const VALID_TYPES: SubmissionType[] = ['problem', 'suggestion', 'idea']
const VALID_DEPARTMENTS: Department[] = [
  'sales', 'operations', 'client_service', 'finance',
  'admin', 'marketing', 'introducers', 'management', 'other',
]
const VALID_FREQUENCIES: Frequency[] = ['daily', 'weekly', 'monthly', 'occasional']
const VALID_IMPACTS: Impact[] = ['low', 'medium', 'high']

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1'
    const rl = checkRateLimit(ip)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many submissions. Try again in ${rl.retryAfterSec}s.` },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
      )
    }

    const body = await req.json()
    const {
      submission_type,
      submitted_by,
      is_anonymous,
      department,
      description,
      process_name,
      system_used,
      time_per_occurrence,
      occurrences_per_week,
      frustration_level,
      error_risk,
      affects_client,
      involves_money,
      frequency,
      impact,
      suggested_fix,
    } = body

    // Validation
    const subType = submission_type || 'problem'
    if (!VALID_TYPES.includes(subType)) {
      return NextResponse.json({ error: 'Invalid submission type.' }, { status: 400 })
    }
    if (!department || !VALID_DEPARTMENTS.includes(department)) {
      return NextResponse.json({ error: 'Invalid department.' }, { status: 400 })
    }
    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return NextResponse.json(
        { error: 'Description must be at least 10 characters.' },
        { status: 400 }
      )
    }

    // Quick ideas have relaxed requirements
    const isQuickIdea = subType === 'idea'

    if (!isQuickIdea) {
      if (!frequency || !VALID_FREQUENCIES.includes(frequency)) {
        return NextResponse.json({ error: 'Invalid frequency.' }, { status: 400 })
      }
      if (!impact || !VALID_IMPACTS.includes(impact)) {
        return NextResponse.json({ error: 'Invalid impact.' }, { status: 400 })
      }
    }

    if (frustration_level != null && (frustration_level < 1 || frustration_level > 5)) {
      return NextResponse.json({ error: 'Frustration level must be 1–5.' }, { status: 400 })
    }

    // Insert
    const { data, error } = await supabaseAdmin
      .from('submissions')
      .insert({
        submission_type: subType,
        submitted_by: is_anonymous ? null : (submitted_by?.trim() || null),
        is_anonymous: Boolean(is_anonymous),
        department,
        description: description.trim(),
        process_name: process_name?.trim() || null,
        system_used: system_used?.trim() || null,
        time_per_occurrence: time_per_occurrence ?? null,
        occurrences_per_week: occurrences_per_week ?? null,
        frustration_level: frustration_level ?? null,
        error_risk: Boolean(error_risk),
        affects_client: Boolean(affects_client),
        involves_money: Boolean(involves_money),
        frequency: isQuickIdea ? 'occasional' : frequency,
        impact: isQuickIdea ? 'medium' : impact,
        suggested_fix: suggested_fix?.trim() || null,
        status: 'new',
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error('[POST /api/submissions] Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to save submission. Please try again.' },
        { status: 500 }
      )
    }

    // Notify (non-blocking)
    notifyNewSubmission(data.id, department).catch(() => null)

    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/submissions] Unexpected error:', err)
    return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 })
  }
}
