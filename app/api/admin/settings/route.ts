import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminRequest } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authErr = await validateAdminRequest(req)
  if (authErr) return authErr

  try {
    const { data, error } = await supabaseAdmin
      .from('app_config')
      .select('key, value')
      .in('key', ['resend_from', 'report_recipients', 'setup_complete'])

    if (error) {
      return NextResponse.json({ error: 'Failed to load settings.' }, { status: 500 })
    }

    const config: Record<string, string | null> = {}
    for (const row of data ?? []) {
      config[row.key] = row.value
    }

    return NextResponse.json({ config })
  } catch (err) {
    console.error('[GET /api/admin/settings]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const authErr = await validateAdminRequest(req)
  if (authErr) return authErr

  try {
    const { key, value } = await req.json()

    const ALLOWED_KEYS = ['resend_from', 'report_recipients']
    if (!ALLOWED_KEYS.includes(key)) {
      return NextResponse.json({ error: 'Invalid config key.' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('app_config')
      .upsert({ key, value }, { onConflict: 'key' })

    if (error) {
      return NextResponse.json({ error: 'Failed to update setting.' }, { status: 500 })
    }

    logAdminAction({
      action: 'settings_updated',
      entity_type: 'settings',
      summary: `Updated ${key}`,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PATCH /api/admin/settings]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
