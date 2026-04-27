import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminRequest } from '@/lib/admin-auth'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // allow up to 60s for AI response

const SYSTEM_PROMPT = `You are an automation consultant advising the AI & Automation Lead at Arie Finance, a regulated payments company in Mauritius.
The operator has described a business process or operation.
Produce a concrete, actionable automation blueprint.
Be specific — name actual tools, sequences, integration points.
Do not give generic advice.
Assume the operator is technically capable and will implement this themselves.
Tone: direct, practical, like a smart colleague — not a consultant writing a proposal.

Return exactly 4 sections:

AUTOMATION POTENTIAL: [score 1-10] — [one sentence why]

WHAT TO AUTOMATE:
[bullet list of specific steps that can be automated]

HOW TO DO IT:
[numbered steps with tools named explicitly]
[format each as: Trigger → Action → Output]
[include effort: Quick / Half day / Full day / Multi-day]

WHAT TO KEEP HUMAN:
[what should not be automated and why — compliance, relationships, judgement calls]`

function extractScore(output: string): number | null {
  const match = output.match(/AUTOMATION POTENTIAL:\s*(\d+)/i)
  if (!match) return null
  const score = parseInt(match[1], 10)
  return isNaN(score) ? null : Math.max(1, Math.min(10, score))
}

export async function GET(req: NextRequest) {
  const authErr = await validateAdminRequest(req)
  if (authErr) return authErr

  const { data, error } = await supabaseAdmin
    .from('lab_sessions')
    .select('id, input_text, ai_output, automation_score, kpi_area, created_at, saved_to_notes, promoted_to_pipeline')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: 'Failed to load lab sessions.' }, { status: 500 })
  return NextResponse.json({ sessions: data ?? [] })
}

export async function POST(req: NextRequest) {
  const authErr = await validateAdminRequest(req)
  if (authErr) return authErr

  try {
    const { input_text, kpi_area, linked_submission_id, linked_project_id } = await req.json()

    if (!input_text?.trim() || input_text.trim().length < 10) {
      return NextResponse.json({ error: 'Please describe the process (min 10 characters).' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'AI not configured. Set ANTHROPIC_API_KEY.' }, { status: 503 })
    }

    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: input_text.trim() }],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected AI response.' }, { status: 500 })
    }

    const aiOutput = content.text.trim()
    const automationScore = extractScore(aiOutput)

    // Save to lab_sessions
    const { data: session, error: insertError } = await supabaseAdmin
      .from('lab_sessions')
      .insert({
        input_text: input_text.trim(),
        kpi_area: kpi_area || null,
        linked_submission_id: linked_submission_id || null,
        linked_project_id: linked_project_id || null,
        ai_output: aiOutput,
        automation_score: automationScore,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[lab] Failed to save session:', insertError)
    }

    return NextResponse.json({ sessionId: session?.id ?? null, aiOutput, automationScore })
  } catch (err) {
    console.error('[POST /api/admin/lab]', err)
    return NextResponse.json({ error: 'AI analysis failed.' }, { status: 500 })
  }
}
