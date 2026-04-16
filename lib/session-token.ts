/**
 * Admin session token utilities (Edge-compatible — uses WebCrypto).
 *
 * Instead of storing the raw ADMIN_API_SECRET in a cookie, we derive a
 * deterministic HMAC token from it. This means:
 *   - The cookie value cannot be reverse-engineered to recover the secret.
 *   - The server can re-derive the same token to validate the cookie.
 *   - If the secret rotates, all existing sessions are automatically invalid.
 *
 * This is a pragmatic improvement for an internal tool — NOT a replacement
 * for proper session management with signed JWTs or database-backed sessions.
 *
 * Uses globalThis.crypto.subtle (WebCrypto) so it works in both Node.js
 * and Next.js Edge middleware runtime.
 */

const TOKEN_PURPOSE = 'ops-intelligence-hub-admin-session-v1'
const encoder = new TextEncoder()

/**
 * Derive a session token from the admin secret.
 * Deterministic: same secret always produces the same token.
 */
export async function deriveSessionToken(secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(TOKEN_PURPOSE))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Constant-time comparison of two strings.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  const aBuf = encoder.encode(a)
  const bBuf = encoder.encode(b)
  let result = 0
  for (let i = 0; i < aBuf.length; i++) {
    result |= aBuf[i] ^ bBuf[i]
  }
  return result === 0
}

/**
 * Validate a session token against the admin secret.
 */
export async function validateSessionToken(token: string, secret: string): Promise<boolean> {
  const expected = await deriveSessionToken(secret)
  return constantTimeEqual(token, expected)
}
