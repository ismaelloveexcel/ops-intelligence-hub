import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { deriveSessionToken } from '@/lib/session-token'

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
    const passwordBuf = Buffer.from(password)
    const secretBuf = Buffer.from(secret)
    if (passwordBuf.length !== secretBuf.length || !timingSafeEqual(passwordBuf, secretBuf)) {
      return NextResponse.json({ error: 'Invalid password.' }, { status: 401 })
    }

    // Derive an HMAC token — the raw secret is never stored in the cookie
    const token = deriveSessionToken(secret)

    const response = NextResponse.json({ success: true })

    response.cookies.set('ops-admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      // 7-day session — reasonable for an internal tool
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
