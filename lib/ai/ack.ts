import Anthropic from '@anthropic-ai/sdk'

export interface AckDraft {
  subject: string
  body: string
}

/**
 * Generate a warm acknowledgement email draft from Ismael to a submitter.
 * Returns null on failure — never throws.
 */
export async function generateAckDraft(
  processName: string,
  statusLabel: 'accepted' | 'implemented',
  hoursSaved?: number | null
): Promise<AckDraft | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  try {
    const client = new Anthropic({ apiKey })

    const impactLine = hoursSaved
      ? `If implemented: mention that it saves roughly ${hoursSaved} hours of manual work.`
      : 'If implemented: mention the impact briefly in one line if you can infer it.'

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Write a short, warm email from Ismael to a colleague at a small, close-knit financial services team in Mauritius.
Their suggestion about "${processName}" has been ${statusLabel}.
Tone: message from a colleague, not a system notification. Warm but not over the top.
${impactLine}
2-3 sentences max. No corporate sign-off. Sign as: Ismael
Example feel: "Hey [name], your suggestion about [process] is now live. [One line on impact]. Thanks for flagging it, genuinely helpful. — Ismael"
Write the email body only. No subject line.`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') return null

    const body = content.text.trim()
    const subject =
      statusLabel === 'implemented'
        ? `Your suggestion about ${processName} is now live`
        : `Update on your suggestion — ${processName}`

    return { subject, body }
  } catch (err) {
    console.error('[ack] Failed to generate acknowledgement draft:', err)
    return null
  }
}
