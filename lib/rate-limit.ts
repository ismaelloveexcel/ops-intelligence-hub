/**
 * Rate limiter for the public submission endpoint.
 *
 * Uses Upstash Redis sliding window when configured (UPSTASH_REDIS_REST_URL +
 * UPSTASH_REDIS_REST_TOKEN), falling back to an in-memory map for local dev.
 *
 * Limit: 10 requests / 15 minutes / IP.
 * Fallback: if Upstash is unavailable → allow the request and log a warning.
 * The public form must never be broken by a rate-limiter failure.
 */

const MAX_REQUESTS = 10
const WINDOW_SEC = 15 * 60 // 15 minutes

// ─── Upstash implementation ───────────────────────────────────────────────────

async function checkUpstash(ip: string): Promise<{ allowed: boolean; retryAfterSec?: number }> {
  const { Ratelimit } = await import('@upstash/ratelimit')
  const { Redis } = await import('@upstash/redis')

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(MAX_REQUESTS, `${WINDOW_SEC} s`),
    prefix: 'ops-hub-rl',
  })

  const { success, reset } = await ratelimit.limit(ip)

  if (success) return { allowed: true }

  const retryAfterSec = Math.max(0, Math.ceil((reset - Date.now()) / 1000))
  return { allowed: false, retryAfterSec }
}

// ─── In-memory fallback ───────────────────────────────────────────────────────

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()
const WINDOW_MS = WINDOW_SEC * 1000

function checkInMemory(ip: string): { allowed: boolean; retryAfterSec?: number } {
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

// Periodic cleanup — prevents unbounded growth
setInterval(() => {
  const now = Date.now()
  store.forEach((entry, key) => {
    if (now > entry.resetAt) store.delete(key)
  })
}, 5 * 60 * 1000).unref?.()

// ─── Public API ───────────────────────────────────────────────────────────────

export async function checkRateLimit(
  ip: string
): Promise<{ allowed: boolean; retryAfterSec?: number }> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (upstashUrl && upstashToken) {
    try {
      return await checkUpstash(ip)
    } catch (err) {
      // Upstash unavailable — fall back to in-memory and log warning
      console.warn('[rate-limit] Upstash check failed, falling back to in-memory:', err)
    }
  }

  return checkInMemory(ip)
}
