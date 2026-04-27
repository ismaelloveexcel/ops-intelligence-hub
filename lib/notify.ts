import { getResendFrom } from '@/lib/app-config'

/**
 * Sends an email notification to the admin when a new submission arrives.
 * Silently skips if RESEND_API_KEY or ADMIN_EMAIL are not configured.
 *
 * Uses app_config.resend_from for the from email address.
 */
export async function notifyNewSubmission(
  submissionId: string,
  department: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const adminEmail = process.env.ADMIN_EMAIL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (!apiKey || !adminEmail) return

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)
    const fromEmail = await getResendFrom()

    await resend.emails.send({
      from: `Ismael – Arie Finance <${fromEmail}>`,
      to: adminEmail,
      subject: `New submission from ${department} — Arie Finance`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;">
          <div style="background:#0A1628;padding:20px 28px;border-bottom:2px solid #C9A84C;">
            <span style="color:#fff;font-weight:700;font-size:15px;letter-spacing:1px;">ARIE FINANCE</span>
            <span style="color:rgba(255,255,255,0.45);font-size:11px;margin-left:12px;">Internal Operations Intelligence</span>
          </div>
          <div style="padding:28px;background:#fff;color:#1A1A2E;">
            <h2 style="margin:0 0 8px;font-size:18px;color:#0A1628;">New submission — ${department}</h2>
            <p style="color:#555;margin:0 0 24px;font-size:14px;line-height:1.6;">
              A new operational submission has been received from the <strong>${department}</strong> team.
            </p>
            <a
              href="${appUrl}/admin/${submissionId}"
              style="display:inline-block;background:#0A1628;color:#C9A84C;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;"
            >
              Review Submission →
            </a>
          </div>
          <div style="background:#0A1628;padding:14px 28px;text-align:center;">
            <span style="color:rgba(255,255,255,0.35);font-size:11px;">Arie Finance | Sent by your AI &amp; Automation Lead</span>
          </div>
        </div>
      `,
    })
  } catch (err) {
    console.error('[notify] Failed to send admin email:', err)
  }
}

  submissionId: string,
  department: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const adminEmail = process.env.ADMIN_EMAIL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (!apiKey || !adminEmail) return

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)

    await resend.emails.send({
      from: 'Operations Hub <noreply@resend.dev>',
      to: adminEmail,
      subject: `New submission from ${department} — Operations Hub`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #00d4c8; margin-bottom: 8px;">New Submission Received</h2>
          <p style="color: #555; margin-bottom: 24px;">
            A new pain-point has been submitted from the <strong>${department}</strong> department.
          </p>
          <a
            href="${appUrl}/admin/${submissionId}"
            style="
              display: inline-block;
              background: #00d4c8;
              color: #07111f;
              font-weight: 600;
              padding: 12px 24px;
              border-radius: 8px;
              text-decoration: none;
            "
          >
            Review Submission →
          </a>
          <p style="color: #aaa; font-size: 12px; margin-top: 32px;">
            Operations Intelligence Hub · Internal Portal
          </p>
        </div>
      `,
    })
  } catch (err) {
    // Non-fatal — log but don't throw
    console.error('[notify] Failed to send admin email:', err)
  }
}
