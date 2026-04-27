import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminRequest } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit-log'
import { getResendFrom } from '@/lib/app-config'

/**
 * POST — send an acknowledgement email to a submitter.
 * Body: { submissionId, subject, body, submitterEmail }
 */
export async function POST(req: NextRequest) {
  const authErr = await validateAdminRequest(req)
  if (authErr) return authErr

  try {
    const { submissionId, subject, body, submitterEmail } = await req.json()

    if (!submissionId || !subject || !body || !submitterEmail) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      return NextResponse.json({ error: 'Email sending not configured.' }, { status: 503 })
    }

    const fromEmail = await getResendFrom()
    const { Resend } = await import('resend')
    const resend = new Resend(resendKey)

    const { error: sendError } = await resend.emails.send({
      from: `Ismael – Arie Finance <${fromEmail}>`,
      to: submitterEmail,
      subject,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;">
          <div style="background:#0A1628;padding:20px 28px;border-bottom:2px solid #C9A84C;">
            <span style="color:#fff;font-weight:700;font-size:15px;letter-spacing:1px;">ARIE FINANCE</span>
          </div>
          <div style="padding:28px;background:#fff;color:#1A1A2E;">
            <p style="font-size:15px;line-height:1.7;white-space:pre-wrap;margin:0 0 24px;">${body.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          </div>
          <div style="background:#0A1628;padding:14px 28px;text-align:center;">
            <span style="color:rgba(255,255,255,0.35);font-size:11px;">Arie Finance | Sent by your AI &amp; Automation Lead</span>
          </div>
        </div>
      `,
    })

    if (sendError) {
      console.error('[notifications/send] Resend error:', sendError)
      return NextResponse.json({ error: 'Failed to send email.' }, { status: 500 })
    }

    // Mark pipeline.submitter_notified_at
    await supabaseAdmin
      .from('execution_pipeline')
      .update({ submitter_notified_at: new Date().toISOString() })
      .eq('linked_submission_id', submissionId)

    logAdminAction({
      action: 'notification_sent',
      entity_type: 'notification',
      entity_id: submissionId,
      summary: `Acknowledgement sent to ${submitterEmail}`,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/admin/notifications/send]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
