import { supabaseAdmin } from '@/lib/supabase'

/**
 * Lightweight admin audit logger.
 *
 * Logs admin actions to the `admin_audit_log` table in Supabase.
 * Fire-and-forget: never throws or blocks the calling route.
 *
 * Schema required (see schema/002_audit_log.sql + 005_kpi_and_ai.sql):
 *   admin_audit_log (id, action, entity_type, entity_id, summary,
 *                    actor_email, ip_address, user_agent, created_at)
 */

export type AuditAction =
  | 'review_saved'
  | 'submission_published'
  | 'pipeline_created'
  | 'pipeline_updated'
  | 'pipeline_deleted'
  | 'admin_login'
  | 'admin_logout'
  | 'project_created'
  | 'project_updated'
  | 'project_deleted'
  | 'task_created'
  | 'task_updated'
  | 'task_deleted'
  | 'note_created'
  | 'note_updated'
  | 'note_deleted'
  | 'notification_sent'
  | 'notification_dismissed'
  | 'report_generated'
  | 'settings_updated'

export interface AuditEntry {
  action: AuditAction
  entity_type:
    | 'submission'
    | 'pipeline'
    | 'session'
    | 'project'
    | 'task'
    | 'note'
    | 'notification'
    | 'report'
    | 'settings'
  entity_id?: string | null
  summary?: string | null
  actor_email?: string | null
  ip_address?: string | null
  user_agent?: string | null
}

/**
 * Write an audit log entry. Non-blocking, non-fatal.
 */
export async function logAdminAction(entry: AuditEntry): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('admin_audit_log').insert({
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id ?? null,
      summary: entry.summary ?? null,
      actor_email: entry.actor_email ?? null,
      ip_address: entry.ip_address ?? null,
      user_agent: entry.user_agent ?? null,
    })

    if (error) {
      console.error('[audit-log] Supabase insert error:', error.message)
    }
  } catch (err) {
    // Non-fatal — log to console but never throw
    console.error('[audit-log] Failed to write audit entry:', err)
  }
}
