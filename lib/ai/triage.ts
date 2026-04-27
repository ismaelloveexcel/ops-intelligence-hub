import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase'
import { KpiArea, KPI_AREAS } from '@/lib/types'

interface TriageResult {
  ai_kpi_area: KpiArea
  ai_urgency_score: number
  ai_suggested_action: string
  ai_reasoning: string
}

interface SubmissionInput {
  id: string
  description: string
  department: string
  submission_type: string
  process_name?: string | null
  system_used?: string | null
  error_risk: boolean
  affects_client: boolean
  involves_money: boolean
  frequency: string
  impact: string
  suggested_fix?: string | null
  frustration_level?: number | null
  submitter_email?: string | null
}

/**
 * Fire-and-forget AI triage.
 * Called after a submission is saved — never blocks the POST response.
 * On failure: console.error only, submission already saved.
 */
export function triageSubmissionAsync(submission: SubmissionInput): void {
  // Intentionally not awaited
  triageSubmission(submission).catch((err) =>
    console.error('[triage] Unhandled error in async triage:', err)
  )
}

async function triageSubmission(submission: SubmissionInput): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('[triage] ANTHROPIC_API_KEY not set — skipping AI triage')
    return
  }

  try {
    const client = new Anthropic({ apiKey })

    const contextLines: string[] = [
      `Department: ${submission.department}`,
      `Type: ${submission.submission_type}`,
      `Description: ${submission.description}`,
    ]
    if (submission.process_name) contextLines.push(`Process: ${submission.process_name}`)
    if (submission.system_used) contextLines.push(`System: ${submission.system_used}`)
    contextLines.push(`Frequency: ${submission.frequency}`, `Impact: ${submission.impact}`)
    if (submission.frustration_level)
      contextLines.push(`Frustration: ${submission.frustration_level}/5`)
    contextLines.push(
      `Flags: error_risk=${submission.error_risk}, affects_client=${submission.affects_client}, involves_money=${submission.involves_money}`
    )
    if (submission.suggested_fix)
      contextLines.push(`Suggested fix: ${submission.suggested_fix}`)

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system: `You are an operations analyst at Arie Finance, a regulated payments company in Mauritius. Analyse this employee submission and return JSON only. No preamble. No markdown. No explanation outside the JSON.

Return exactly:
{
  "ai_kpi_area": one of [sales, marketing, introducers, client_service, reporting, sops, finance, ai_knowledge, general_ops],
  "ai_urgency_score": integer 1-10,
  "ai_suggested_action": "one sentence what should be done",
  "ai_reasoning": "one sentence why classified this way"
}`,
      messages: [{ role: 'user', content: contextLines.join('\n') }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type from Claude')

    const raw = content.text.trim()
    // Strip any accidental markdown code fences
    const jsonStr = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim()
    const result = JSON.parse(jsonStr) as TriageResult

    // Validate and sanitise
    if (!KPI_AREAS.includes(result.ai_kpi_area)) result.ai_kpi_area = 'general_ops'
    if (typeof result.ai_urgency_score !== 'number' || isNaN(result.ai_urgency_score)) {
      result.ai_urgency_score = 5
    }
    result.ai_urgency_score = Math.max(1, Math.min(10, Math.round(result.ai_urgency_score)))

    await supabaseAdmin
      .from('submissions')
      .update({
        ai_kpi_area: result.ai_kpi_area,
        ai_urgency_score: result.ai_urgency_score,
        ai_suggested_action: result.ai_suggested_action?.slice(0, 500) ?? null,
        ai_reasoning: result.ai_reasoning?.slice(0, 500) ?? null,
        ai_classified_at: new Date().toISOString(),
      })
      .eq('id', submission.id)

    // High-priority alert: client-affecting + financial risk
    const isHighPriority =
      submission.affects_client &&
      submission.involves_money &&
      ((submission.frustration_level ?? 0) >= 4 || result.ai_urgency_score >= 8)

    if (isHighPriority) {
      await sendUrgentAlert(submission, result).catch((err) =>
        console.error('[triage] Failed to send urgent alert:', err)
      )
    }
  } catch (err) {
    // Silent fallback — submission already saved, AI triage is non-blocking
    console.error('[triage] AI triage failed for submission', submission.id, ':', err)
  }
}

async function sendUrgentAlert(
  submission: SubmissionInput,
  result: TriageResult
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const adminEmail = process.env.ADMIN_EMAIL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (!apiKey || !adminEmail) return

  const { getResendFrom } = await import('@/lib/app-config')
  const fromEmail = await getResendFrom()

  const { Resend } = await import('resend')
  const resend = new Resend(apiKey)

  await resend.emails.send({
    from: `Ismael – Arie Finance <${fromEmail}>`,
    to: adminEmail,
    subject: `⚠️ Urgent submission needs your attention`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#0B1C2C;color:#fff;border-radius:12px;">
        <div style="background:#C9A646;padding:4px 12px;border-radius:4px;display:inline-block;margin-bottom:16px;">
          <strong style="color:#0B1C2C;font-size:12px;">⚠️ URGENT — Client-affecting + financial risk</strong>
        </div>
        <h2 style="color:#fff;margin-bottom:8px;">Needs your attention now</h2>
        <p style="color:rgba(255,255,255,0.7);margin-bottom:6px;"><strong>Department:</strong> ${submission.department}</p>
        <p style="color:rgba(255,255,255,0.7);margin-bottom:6px;"><strong>Urgency score:</strong> ${result.ai_urgency_score}/10</p>
        <p style="color:rgba(255,255,255,0.9);margin-bottom:16px;line-height:1.6;">${submission.description}</p>
        <p style="color:rgba(255,255,255,0.55);font-style:italic;margin-bottom:24px;">${result.ai_reasoning}</p>
        <a href="${appUrl}/admin/${submission.id}" style="display:inline-block;background:#C9A646;color:#0B1C2C;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;">Review Now →</a>
        <p style="color:rgba(255,255,255,0.25);font-size:11px;margin-top:32px;">Arie Finance | Sent by your AI &amp; Automation Lead</p>
      </div>
    `,
  })
}
