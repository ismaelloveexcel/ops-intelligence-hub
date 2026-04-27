import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Edge middleware — protects all /admin pages and /api/admin API routes.
 *
 * Auth strategy:
 *  1. Supabase Auth magic link (primary) — if env vars are set.
 *  2. Legacy HMAC token cookie (backward compat) — if ADMIN_API_SECRET is set.
 *  3. Development bypass — if neither is configured in dev.
 *
 * Note: ADMIN_API_SECRET is kept in env for backward compat but is no longer
 * the primary auth mechanism.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Always allow the login page and auth callback through
  if (
    pathname === '/admin/login' ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/api/auth/')
  ) {
    return NextResponse.next()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // ── 1. Supabase Auth ──────────────────────────────────────────────────────
  if (supabaseUrl && supabaseAnonKey) {
    let res = NextResponse.next({ request: { headers: req.headers } })

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          res = NextResponse.next({ request: { headers: req.headers } })
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    })

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) return res // Authenticated — pass through with refreshed cookies

      // Not authenticated
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
      }
      const loginUrl = new URL('/admin/login', req.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    } catch {
      // Supabase check failed — fall through to legacy
    }
  }

  // ── 2. Legacy HMAC token ──────────────────────────────────────────────────
  const secret = process.env.ADMIN_API_SECRET

  if (secret) {
    const { validateSessionToken } = await import('@/lib/session-token')
    const token = req.cookies.get('ops-admin-token')?.value
    if (token && await validateSessionToken(token, secret)) {
      return NextResponse.next()
    }

    if (pathname.startsWith('/api/admin')) {
      return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
    }
    const loginUrl = new URL('/admin/login', req.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── 3. No auth configured ─────────────────────────────────────────────────
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/admin')) {
    return NextResponse.json(
      { error: 'Admin access not configured.' },
      { status: 500 }
    )
  }
  const loginUrl = new URL('/admin/login', req.url)
  loginUrl.searchParams.set('error', 'not_configured')
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}


/**
 * Edge middleware — protects all /admin pages and /api/admin API routes.
 *
 * Auth strategy (cookie-based with HMAC-derived token):
 *   1. If ADMIN_API_SECRET is set → require a valid `ops-admin-token` cookie
 *      containing the HMAC-derived token (not the raw secret).
 *   2. In development with no secret → allow through with a console warning.
 *   3. Otherwise → redirect pages to /admin/login or reject API calls with 401.
 *
 * The cookie is set by /api/auth/admin-login after password verification.
 */
export async function middleware(req: NextRequest) {
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

  if (token && await validateSessionToken(token, secret)) {
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
