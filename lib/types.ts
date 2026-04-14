// ─── Enum Types ──────────────────────────────────────────────────────────────

export type Department =
  | 'sales'
  | 'operations'
  | 'client_service'
  | 'finance'
  | 'admin'
  | 'other'

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'occasional'

export type Impact = 'low' | 'medium' | 'high'

export type SubmissionStatus =
  | 'new'
  | 'reviewing'
  | 'accepted'
  | 'in_progress'
  | 'rejected'
  | 'implemented'

export type ActionType =
  | 'quick_fix'
  | 'sop_update'
  | 'automation'
  | 'training'
  | 'escalate'
  | 'reject'

export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export type Ease = 'easy' | 'medium' | 'hard'

// ─── Data Interfaces ─────────────────────────────────────────────────────────

export interface Submission {
  id: string
  created_at: string
  submitted_by: string | null
  is_anonymous: boolean
  department: Department
  description: string
  frequency: Frequency
  impact: Impact
  suggested_fix: string | null
  status: SubmissionStatus
}

export interface ReviewAction {
  id: string
  submission_id: string
  reviewed_at: string
  action_type: ActionType | null
  priority: Priority | null
  owner: string | null
  target_date: string | null
  time_wasted_hrs: number | null
  ease: Ease | null
  admin_notes: string | null
  published_to_feed: boolean
  resolved_at: string | null
}

export interface FeedItem {
  id: string
  submission_id: string | null
  title: string
  what_changed: string
  department: Department
  published_at: string
}

export interface AdminBoardRow extends Submission {
  display_name: string
  action_type: ActionType | null
  priority: Priority | null
  owner: string | null
  target_date: string | null
  time_wasted_hrs: number | null
  ease: Ease | null
  admin_notes: string | null
  published_to_feed: boolean | null
  resolved_at: string | null
  reviewed_at: string | null
}

// ─── Label Maps ──────────────────────────────────────────────────────────────

export const DEPARTMENT_LABELS: Record<Department, string> = {
  sales: 'Sales',
  operations: 'Operations',
  client_service: 'Client Service',
  finance: 'Finance',
  admin: 'Admin',
  other: 'Other',
}

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  occasional: 'Occasional',
}

export const IMPACT_LABELS: Record<Impact, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  new: 'New',
  reviewing: 'Reviewing',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  rejected: 'Rejected',
  implemented: 'Implemented',
}

export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  quick_fix: 'Quick Fix',
  sop_update: 'SOP Update',
  automation: 'Automation',
  training: 'Training',
  escalate: 'Escalate',
  reject: 'Reject',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

export const EASE_LABELS: Record<Ease, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

// ─── Status Colour Map ───────────────────────────────────────────────────────

export const STATUS_COLORS: Record<SubmissionStatus, string> = {
  new: 'status-new',
  reviewing: 'status-reviewing',
  accepted: 'status-accepted',
  in_progress: 'status-in-progress',
  rejected: 'status-rejected',
  implemented: 'status-implemented',
}

export const IMPACT_COLORS: Record<Impact, string> = {
  low: 'impact-low',
  medium: 'impact-medium',
  high: 'impact-high',
}
