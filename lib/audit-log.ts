import { supabaseAdmin } from '@/lib/supabase'

/**
 * Lightweight admin audit logger.
 *
 * Logs admin actions to the `admin_audit_log` table in Supabase.
 * Fire-and-forget: never throws or blocks the calling route.
 *
 * Schema required (see schema/002_audit_log.sql):
 *   admin_audit_log (id, action, entity_type, entity_id, summary, created_at)
 */

export type AuditAction =
  | 'review_saved'
  | 'submission_published'
  | 'pipeline_created'
  | 'pipeline_updated'
  | 'pipeline_deleted'
  | 'admin_login'
  | 'admin_logout'

export interface AuditEntry {
  action: AuditAction
  entity_type: 'submission' | 'pipeline' | 'session'
  entity_id?: string | null
  summary?: string | null
}

/**
 * Write an audit log entry. Non-blocking, non-fatal.
 */
export async function logAdminAction(entry: AuditEntry): Promise<void> {
  try {
    await supabaseAdmin.from('admin_audit_log').insert({
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id ?? null,
      summary: entry.summary ?? null,
    })
  } catch (err) {
    // Non-fatal — log to console but never throw
    console.error('[audit-log] Failed to write audit entry:', err)
  }
}
