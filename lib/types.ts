// ─── Enum Types ──────────────────────────────────────────────────────────────

export type SubmissionType = 'problem' | 'suggestion' | 'idea'

export type Department =
  | 'sales'
  | 'operations'
  | 'client_service'
  | 'finance'
  | 'admin'
  | 'marketing'
  | 'introducers'
  | 'management'
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

export type ReviewCategory = 'automation' | 'process' | 'training' | 'ignore'

export type ImplementationEffort = 'quick' | 'medium' | 'heavy'

export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export type Ease = 'easy' | 'medium' | 'hard'

export type ExecutionStatus = 'planned' | 'in_progress' | 'testing' | 'deployed' | 'cancelled'

// ─── Data Interfaces ─────────────────────────────────────────────────────────

export interface Submission {
  id: string
  created_at: string
  submission_type: SubmissionType
  submitted_by: string | null
  is_anonymous: boolean
  department: Department
  description: string
  process_name: string | null
  system_used: string | null
  time_per_occurrence: number | null
  occurrences_per_week: number | null
  frustration_level: number | null   // 1–5
  error_risk: boolean
  affects_client: boolean
  involves_money: boolean
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
  automation_potential: number | null   // 1–5
  implementation_effort: ImplementationEffort | null
  review_category: ReviewCategory | null
  impact_level: Impact | null
  estimated_hours_saved_monthly: number | null
}

export interface FeedItem {
  id: string
  submission_id: string | null
  title: string
  what_changed: string
  department: Department
  published_at: string
  hours_saved: number | null
  before_summary: string | null
  after_summary: string | null
}

export interface ExecutionPipelineItem {
  id: string
  created_at: string
  linked_submission_id: string | null
  title: string
  solution_type: string | null
  tool_used: string | null
  status: ExecutionStatus
  deployed_link: string | null
  before_time: number | null
  after_time: number | null
  actual_hours_saved: number | null
  notes: string | null
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
  automation_potential: number | null
  implementation_effort: ImplementationEffort | null
  review_category: ReviewCategory | null
  impact_level: Impact | null
  estimated_hours_saved_monthly: number | null
  hours_wasted_month: number | null
  priority_score: number | null
}

// ─── Formulas ────────────────────────────────────────────────────────────────

/** Estimated hours wasted per month: (time_per_occurrence × occurrences_per_week × 4) / 60 */
export function calcHoursWastedMonth(
  timePerOccurrenceMin: number | null,
  occurrencesPerWeek: number | null
): number | null {
  if (timePerOccurrenceMin == null || occurrencesPerWeek == null) return null
  return (timePerOccurrenceMin * occurrencesPerWeek * 4) / 60
}

/** Quick win: automation_potential >= 4 AND implementation_effort = 'quick' */
export function isQuickWin(
  automationPotential: number | null,
  implementationEffort: ImplementationEffort | string | null
): boolean {
  return (automationPotential ?? 0) >= 4 && implementationEffort === 'quick'
}

/** Priority score: hours_wasted_month × automation_potential × frustration_level */
export function calcPriorityScore(
  hoursWastedMonth: number | null,
  automationPotential: number | null,
  frustrationLevel: number | null
): number | null {
  if (hoursWastedMonth == null || automationPotential == null || frustrationLevel == null) return null
  return Math.round(hoursWastedMonth * automationPotential * frustrationLevel * 100) / 100
}

// ─── Label Maps ──────────────────────────────────────────────────────────────

export const SUBMISSION_TYPE_LABELS: Record<SubmissionType, string> = {
  problem: 'Problem',
  suggestion: 'Suggestion',
  idea: 'Quick Idea',
}

export const DEPARTMENT_LABELS: Record<Department, string> = {
  sales: 'Sales',
  operations: 'Operations',
  client_service: 'Client Service',
  finance: 'Finance',
  admin: 'Admin',
  marketing: 'Marketing',
  introducers: 'Introducers & Partners',
  management: 'Management',
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

export const REVIEW_CATEGORY_LABELS: Record<ReviewCategory, string> = {
  automation: 'Automation',
  process: 'Process',
  training: 'Training',
  ignore: 'Ignore',
}

export const IMPLEMENTATION_EFFORT_LABELS: Record<ImplementationEffort, string> = {
  quick: 'Quick',
  medium: 'Medium',
  heavy: 'Heavy',
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

export const EXECUTION_STATUS_LABELS: Record<ExecutionStatus, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  testing: 'Testing',
  deployed: 'Deployed',
  cancelled: 'Cancelled',
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
