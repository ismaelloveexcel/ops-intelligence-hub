import { NextRequest, NextResponse } from 'next/server'

/**
 * Validate that the incoming request is authorised for admin operations.
 *
 * Strategy (layered):
 * 1. If ADMIN_API_SECRET is configured → require X-Admin-Key header match.
 * 2. In development (NODE_ENV === 'development') → allow through with a warning.
 * 3. Otherwise → reject.
 *
 * This is NOT a substitute for Supabase Auth or a full auth system.
 * It is a pragmatic first-layer guard for an internal tool.
 */
export function validateAdminRequest(req: NextRequest): NextResponse | null {
  const secret = process.env.ADMIN_API_SECRET

  if (secret) {
    const provided = req.headers.get('x-admin-key')
    if (provided === secret) return null // authorised
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
