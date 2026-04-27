import Anthropic from '@anthropic-ai/sdk'

export interface ReportData {
  totalSubmissions: number
  newSubmissions: number
  resolvedThisMonth: number
  totalHoursSaved: number
  automationRate: number
  deptBreakdown: Array<{ department: string; count: number }>
  kpiBreakdown: Array<{ kpi_area: string; open: number; resolved: number; hours_saved: number }>
  topWins: Array<{
    title: string
    what_changed: string
    department: string
    hours_saved: number | null
    before_summary: string | null
    after_summary: string | null
    shoutout: string | null
  }>
  topRisks: Array<{
    description: string
    department: string
    ai_urgency_score: number | null
    days_open: number
    affects_client: boolean
    involves_money: boolean
  }>
  inProgress: Array<{
    title: string
    status: string
    tool_used: string | null
  }>
  rangeLabel: string
}

const SYSTEM_PROMPT = `You are writing a board-ready internal operations report for Arie Finance, a regulated payments company in Mauritius.
This report goes to a small, close-knit leadership team.
Write like a trusted colleague giving a clear-eyed update — not a consultant delivering a formal report.
One genuine human observation per report is encouraged.
Tone: professional, warm, direct. No emojis. No exclamation marks. No filler phrases.
Write in first-person plural where appropriate.
Never reference AI, automation tools, or how the report was made.
Avoid: "It is worth noting", "Going forward", "In conclusion", "As evidenced by the data", "Stakeholders", "Leverage".

Structure your response with these exact section headers:
## Executive Summary
## Operations Overview
## KPI Breakdown
## Top 3 Wins
## Top 3 Risks
## In Progress`

/**
 * Generate an AI-written management report using Claude.
 * Returns markdown on success, null on failure (fallback to ASCII).
 */
export async function generateAIReport(data: ReportData): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  try {
    const client = new Anthropic({ apiKey })

    const prompt = buildPrompt(data)

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') return null
    return content.text
  } catch (err) {
    console.error('[reports] AI report generation failed:', err)
    return null
  }
}

function buildPrompt(data: ReportData): string {
  const lines: string[] = [
    `Report period: ${data.rangeLabel}`,
    '',
    'OPERATIONS DATA:',
    `- Total submissions: ${data.totalSubmissions}`,
    `- New this period: ${data.newSubmissions}`,
    `- Resolved this period: ${data.resolvedThisMonth}`,
    `- Total manual hours saved (all time): ${data.totalHoursSaved.toFixed(1)}h`,
    `- Automation rate: ${data.automationRate.toFixed(0)}%`,
    '',
    'DEPARTMENT ACTIVITY:',
    ...data.deptBreakdown.map((d) => `  ${d.department}: ${d.count} submissions`),
  ]

  if (data.kpiBreakdown.length > 0) {
    lines.push('', 'KPI AREAS:')
    data.kpiBreakdown.forEach((k) => {
      lines.push(`  ${k.kpi_area}: ${k.open} open, ${k.resolved} resolved, ${k.hours_saved.toFixed(1)}h saved`)
    })
  }

  if (data.topWins.length > 0) {
    lines.push('', 'TOP WINS:')
    data.topWins.forEach((w, i) => {
      lines.push(`  ${i + 1}. "${w.title}"`)
      lines.push(`     Department: ${w.department}`)
      if (w.hours_saved) lines.push(`     Hours saved: ${w.hours_saved}h`)
      if (w.before_summary && w.after_summary) {
        lines.push(`     Before: ${w.before_summary}`)
        lines.push(`     After: ${w.after_summary}`)
      }
      if (w.shoutout) lines.push(`     Credit: ${w.shoutout}`)
      lines.push(`     What changed: ${w.what_changed}`)
    })
  }

  if (data.topRisks.length > 0) {
    lines.push('', 'UNRESOLVED HIGH-PRIORITY ITEMS:')
    data.topRisks.forEach((r, i) => {
      const flags = [
        r.affects_client ? 'affects client' : '',
        r.involves_money ? 'financial risk' : '',
      ].filter(Boolean).join(', ')
      lines.push(`  ${i + 1}. ${r.description.slice(0, 100)}`)
      lines.push(`     Department: ${r.department}, Open: ${r.days_open} days${flags ? `, Flags: ${flags}` : ''}${r.ai_urgency_score ? `, Urgency: ${r.ai_urgency_score}/10` : ''}`)
    })
  }

  if (data.inProgress.length > 0) {
    lines.push('', 'IN PROGRESS:')
    data.inProgress.forEach((p) => {
      lines.push(`  - ${p.title} (${p.status}${p.tool_used ? ` — ${p.tool_used}` : ''})`)
    })
  }

  lines.push('', 'Write the report now.')
  return lines.join('\n')
}
