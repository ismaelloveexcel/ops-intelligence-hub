import { NextRequest, NextResponse } from 'next/server'

/**
 * Edge middleware — protects all /admin pages and /api/admin API routes.
 *
 * Auth strategy (cookie-based):
 *   1. If ADMIN_API_SECRET is set → require a matching `ops-admin-token` cookie.
 *   2. In development with no secret → allow through with a console warning.
 *   3. Otherwise → redirect pages to /admin/login or reject API calls with 401.
 *
 * The cookie is set by /api/auth/admin-login after password verification.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Always allow the login page and auth endpoints through
  if (pathname === '/admin/login') return NextResponse.next()

  const secret = process.env.ADMIN_API_SECRET

  // ── No secret configured ──────────────────────────────────────────────────
  if (!secret) {
    if (process.env.NODE_ENV === 'development') {
      // Development bypass — allow everything
      return NextResponse.next()
    }
    // Production without secret — block access
    if (pathname.startsWith('/api/admin')) {
      return NextResponse.json(
        { error: 'Admin access not configured. Set ADMIN_API_SECRET.' },
        { status: 500 }
      )
    }
    const loginUrl = new URL('/admin/login', req.url)
    loginUrl.searchParams.set('error', 'not_configured')
    return NextResponse.redirect(loginUrl)
  }

  // ── Secret configured — check cookie ──────────────────────────────────────
  const token = req.cookies.get('ops-admin-token')?.value

  if (token === secret) {
    return NextResponse.next()
  }

  // Not authenticated
  if (pathname.startsWith('/api/admin')) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }

  // Redirect to login for page routes
  const loginUrl = new URL('/admin/login', req.url)
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
