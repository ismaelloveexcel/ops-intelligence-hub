import { supabaseAdmin } from '@/lib/supabase'

/**
 * Read a single value from the app_config table.
 * Returns null if the key doesn't exist or on error.
 */
export async function getAppConfig(key: string): Promise<string | null> {
  try {
    const { data } = await supabaseAdmin
      .from('app_config')
      .select('value')
      .eq('key', key)
      .single()
    return data?.value ?? null
  } catch {
    return null
  }
}

/**
 * Set a value in the app_config table (upsert).
 * Returns true on success, false on error.
 */
export async function setAppConfig(key: string, value: string | null): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('app_config')
      .upsert({ key, value }, { onConflict: 'key' })
    return !error
  } catch {
    return false
  }
}

/** Get the Resend from-email address, falling back to placeholder. */
export async function getResendFrom(): Promise<string> {
  const value = await getAppConfig('resend_from')
  return value ?? 'noreply@placeholder.com'
}

/** Get report recipient list. Returns [] on parse error. */
export async function getReportRecipients(): Promise<string[]> {
  try {
    const raw = await getAppConfig('report_recipients')
    if (!raw) return []
    return JSON.parse(raw) as string[]
  } catch {
    return []
  }
}
