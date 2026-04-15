import { NextResponse } from 'next/server'

/**
 * POST/GET /api/auth/admin-logout
 *
 * Clears the admin session cookie.
 * GET redirects to the login page (for link-based sign-out).
 * POST returns JSON (for JS callers).
 */
export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set('ops-admin-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return response
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const response = NextResponse.redirect(new URL('/admin/login', baseUrl))
  response.cookies.set('ops-admin-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return response
}
