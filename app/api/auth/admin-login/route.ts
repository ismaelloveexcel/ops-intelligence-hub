import { NextRequest, NextResponse } from 'next/server'
import { deriveSessionToken, constantTimeEqual } from '@/lib/session-token'
import { logAdminAction } from '@/lib/audit-log'

/** Session duration: 7 days in seconds */
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

/**
 * POST /api/auth/admin-login
 *
 * Validates the provided password against ADMIN_API_SECRET and sets an
 * HttpOnly session cookie containing an HMAC-derived token (not the raw secret).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { password } = body

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required.' }, { status: 400 })
    }

    const secret = process.env.ADMIN_API_SECRET

    if (!secret) {
      return NextResponse.json(
        { error: 'Admin access not configured. Set ADMIN_API_SECRET.' },
        { status: 500 }
      )
    }

    // Constant-time comparison to prevent timing attacks
    if (!constantTimeEqual(password, secret)) {
      return NextResponse.json({ error: 'Invalid password.' }, { status: 401 })
    }

    // Derive an HMAC token — the raw secret is never stored in the cookie
    const token = await deriveSessionToken(secret)

    const response = NextResponse.json({ success: true })

    response.cookies.set('ops-admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    })

    // Audit log (non-blocking)
    logAdminAction({
      action: 'admin_login',
      entity_type: 'session',
      summary: 'Admin login successful',
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
