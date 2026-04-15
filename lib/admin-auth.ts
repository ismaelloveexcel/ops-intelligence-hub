import { NextRequest, NextResponse } from 'next/server'

/**
 * Validate that the incoming request is authorised for admin operations.
 *
 * Defence-in-depth check used INSIDE individual API route handlers.
 * Primary auth is handled by middleware.ts (cookie-based).
 * This function provides a secondary check in case middleware is bypassed.
 *
 * Strategy:
 * 1. If ADMIN_API_SECRET is configured → require matching `ops-admin-token` cookie.
 * 2. In development (NODE_ENV === 'development') without secret → allow with warning.
 * 3. Otherwise → reject.
 */
export function validateAdminRequest(req: NextRequest): NextResponse | null {
  const secret = process.env.ADMIN_API_SECRET

  if (secret) {
    // Check session cookie (set by /api/auth/admin-login)
    const token = req.cookies.get('ops-admin-token')?.value
    if (token === secret) return null // authorised

    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }

  // Development bypass
  if (process.env.NODE_ENV === 'development') {
    console.warn('[admin-auth] No ADMIN_API_SECRET set — allowing in development mode.')
    return null
  }

  return NextResponse.json(
    { error: 'Admin access not configured. Set ADMIN_API_SECRET.' },
    { status: 500 }
  )
}
