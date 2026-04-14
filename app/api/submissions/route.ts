import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { notifyNewSubmission } from '@/lib/notify'
import { Department, Frequency, Impact } from '@/lib/types'

const VALID_DEPARTMENTS: Department[] = [
  'sales',
  'operations',
  'client_service',
  'finance',
  'admin',
  'other',
]
const VALID_FREQUENCIES: Frequency[] = ['daily', 'weekly', 'monthly', 'occasional']
const VALID_IMPACTS: Impact[] = ['low', 'medium', 'high']

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      submitted_by,
      is_anonymous,
      department,
      description,
      frequency,
      impact,
      suggested_fix,
    } = body

    // ─── Validation ───────────────────────────────────────────────────────────
    if (!department || !VALID_DEPARTMENTS.includes(department)) {
      return NextResponse.json({ error: 'Invalid department.' }, { status: 400 })
    }
    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return NextResponse.json(
        { error: 'Description must be at least 10 characters.' },
        { status: 400 }
      )
    }
    if (!frequency || !VALID_FREQUENCIES.includes(frequency)) {
      return NextResponse.json({ error: 'Invalid frequency.' }, { status: 400 })
    }
    if (!impact || !VALID_IMPACTS.includes(impact)) {
      return NextResponse.json({ error: 'Invalid impact.' }, { status: 400 })
    }

    // ─── Insert ───────────────────────────────────────────────────────────────
    const { data, error } = await supabaseAdmin
      .from('submissions')
      .insert({
        submitted_by: is_anonymous ? null : (submitted_by?.trim() || null),
        is_anonymous: Boolean(is_anonymous),
        department,
        description: description.trim(),
        frequency,
        impact,
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

    // ─── Notify (non-blocking) ────────────────────────────────────────────────
    notifyNewSubmission(data.id, department).catch(() => null)

    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/submissions] Unexpected error:', err)
    return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 })
  }
}
