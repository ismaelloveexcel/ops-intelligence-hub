import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Admin session token utilities.
 *
 * Instead of storing the raw ADMIN_API_SECRET in a cookie, we derive a
 * deterministic HMAC token from it. This means:
 *   - The cookie value cannot be reverse-engineered to recover the secret.
 *   - The server can re-derive the same token to validate the cookie.
 *   - If the secret rotates, all existing sessions are automatically invalid.
 *
 * This is a pragmatic improvement for an internal tool — NOT a replacement
 * for proper session management with signed JWTs or database-backed sessions.
 */

const TOKEN_PURPOSE = 'ops-intelligence-hub-admin-session-v1'

/**
 * Derive a session token from the admin secret.
 * Deterministic: same secret always produces the same token.
 */
export function deriveSessionToken(secret: string): string {
  return createHmac('sha256', secret).update(TOKEN_PURPOSE).digest('hex')
}

/**
 * Validate a session token against the admin secret.
 */
export function validateSessionToken(token: string, secret: string): boolean {
  const expected = deriveSessionToken(secret)
  if (token.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected))
}
