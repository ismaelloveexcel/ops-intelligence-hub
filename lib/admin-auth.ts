import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Validate that the incoming request is authorised for admin operations.
 *
 * Defence-in-depth check used INSIDE individual API route handlers.
 * Primary auth is handled by middleware.ts.
 *
 * Strategy:
 *  1. If Supabase env vars are set → verify Supabase Auth session.
 *  2. Fall back to legacy HMAC token check for backward compatibility.
 *  3. In development without any secret → allow with warning.
 */
export async function validateAdminRequest(req: NextRequest): Promise<NextResponse | null> {
  // ── 1. Supabase Auth ──────────────────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return req.cookies.getAll()
          },
          setAll() {
            // read-only in route handlers
          },
        },
      })
      const { data: { user } } = await supabase.auth.getUser()
      if (user) return null // authorised
    } catch {
      // Fall through to legacy check
    }
  }

  // ── 2. Legacy HMAC token (backward compat) ─────────────────────────────
  const secret = process.env.ADMIN_API_SECRET
  if (secret) {
    const { validateSessionToken } = await import('@/lib/session-token')
    const token = req.cookies.get('ops-admin-token')?.value
    if (token && await validateSessionToken(token, secret)) return null
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }

  // ── 3. Development bypass ─────────────────────────────────────────────
  if (process.env.NODE_ENV === 'development') {
    console.warn('[admin-auth] No auth configured — allowing in development mode.')
    return null
  }

  return NextResponse.json(
    { error: 'Admin access not configured.' },
    { status: 500 }
  )
}

/**
 * Get the authenticated user's email from Supabase session.
 * Returns null on failure — never throws.
 */
export async function getActorEmail(req: NextRequest): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll() {},
      },
    })
    const { data: { user } } = await supabase.auth.getUser()
    return user?.email ?? null
  } catch {
    return null
  }
}

