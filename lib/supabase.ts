import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ─── Browser client (anon key, safe to expose) ──────────────────────────────

let _anonClient: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (!_anonClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    if (!url) throw new Error('[CONFIG] NEXT_PUBLIC_SUPABASE_URL is not set.')
    if (!key) throw new Error('[CONFIG] NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.')
    _anonClient = createClient(url, key)
  }
  return _anonClient
}

/** Lazy proxy — imports don't crash at build time */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase()
    const value = (client as unknown as Record<string | symbol, unknown>)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})

// ─── Server/admin client (service role key — server-side only) ──────────────
// SECURITY: Never fall back to anon key for admin operations

let _adminClient: SupabaseClient | null = null

function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

  if (!url) throw new Error('[CONFIG] NEXT_PUBLIC_SUPABASE_URL is not set.')
  if (!serviceKey) {
    throw new Error(
      '[SECURITY] SUPABASE_SERVICE_ROLE_KEY is not set. ' +
      'Admin operations require a service role key. ' +
      'Do NOT fall back to anon key.'
    )
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!_adminClient) _adminClient = createAdminClient()
  return _adminClient
}

/** Lazy proxy — throws at runtime if key is missing */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin()
    const value = (client as unknown as Record<string | symbol, unknown>)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})
