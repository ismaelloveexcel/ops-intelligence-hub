import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/auth/admin-login
 *
 * Validates the provided password against ADMIN_API_SECRET and sets an
 * HttpOnly session cookie on success.
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

    // Constant-time comparison is ideal but for an internal tool,
    // a direct comparison is acceptable.
    if (password !== secret) {
      return NextResponse.json({ error: 'Invalid password.' }, { status: 401 })
    }

    // Set session cookie
    const response = NextResponse.json({ success: true })

    response.cookies.set('ops-admin-token', secret, {
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
