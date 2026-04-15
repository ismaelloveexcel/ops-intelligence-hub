/**
 * Simple in-memory rate limiter for the public submission endpoint.
 * Limits each IP to `maxRequests` within `windowMs`.
 *
 * NOTE: This resets on server restart and does not share state across instances.
 * For production at scale, swap to Redis/Upstash.
 */

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

const MAX_REQUESTS = 10
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true }
  }

  if (entry.count >= MAX_REQUESTS) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, retryAfterSec }
  }

  entry.count++
  return { allowed: true }
}

// Periodic cleanup (every 5 min) so the map doesn't grow unbounded
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 5 * 60 * 1000).unref?.()
