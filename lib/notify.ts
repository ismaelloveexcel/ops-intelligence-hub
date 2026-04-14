/**
 * Sends an email notification to the admin when a new submission arrives.
 * Silently skips if RESEND_API_KEY or ADMIN_EMAIL are not configured.
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
