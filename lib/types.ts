// ─── Enum Types ──────────────────────────────────────────────────────────────

export type KpiArea =
  | 'sales'
  | 'marketing'
  | 'introducers'
  | 'client_service'
  | 'reporting'
  | 'sops'
  | 'finance'
  | 'ai_knowledge'
  | 'general_ops'

export const KPI_AREA_LABELS: Record<KpiArea, string> = {
  sales: 'Sales & Lead Mgmt',
  marketing: 'Marketing',
  introducers: 'Introducers & Partners',
  client_service: 'Client Service',
  reporting: 'Management Reporting',
  sops: 'SOPs & Operations',
  finance: 'Finance Support',
  ai_knowledge: 'AI & Knowledge',
  general_ops: 'General Ops',
}

export const KPI_AREAS: KpiArea[] = [
  'sales', 'marketing', 'introducers', 'client_service',
  'reporting', 'sops', 'finance', 'ai_knowledge', 'general_ops',
]

export type SolutionCategory =
  | 'automation'
  | 'process_change'
  | 'training'
  | 'tool_purchase'
  | 'policy_change'

export const SOLUTION_CATEGORY_LABELS: Record<SolutionCategory, string> = {
  automation: 'Automation',
  process_change: 'Process Change',
  training: 'Training',
  tool_purchase: 'Tool Purchase',
  policy_change: 'Policy Change',
}

export type ProjectStatus = 'private' | 'active' | 'completed' | 'archived'
export type ProjectVisibility = 'private' | 'internal' | 'public'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskSource = 'self' | 'management' | 'ad_hoc' | 'cross_functional'
export type SopStatus = 'draft' | 'approved' | 'published'
export type ReportRunStatus = 'draft' | 'sent'

export const TASK_SOURCE_LABELS: Record<TaskSource, string> = {
  self: 'Self-initiated',
  management: 'From management',
  ad_hoc: 'Ad hoc',
  cross_functional: 'Cross-functional',
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
}

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

export type Visibility = 'private' | 'internal' | 'public'

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
  // A1 additions
  kpi_area: KpiArea | null
  ai_kpi_area: KpiArea | null
  ai_urgency_score: number | null
  ai_suggested_action: string | null
  ai_reasoning: string | null
  ai_classified_at: string | null
  ai_cluster_id: string | null
  submitter_email: string | null
}

export interface ReviewAction {
  id: string
  submission_id: string
  reviewed_at: string
  action_type: ActionType | null
  priority: Priority | null
  owner: string | null
  target_date: string | null
  time_wasted_hrs: number | null   // deprecated — prefer estimated_hours_saved_monthly
  ease: Ease | null                 // deprecated — prefer implementation_effort
  admin_notes: string | null
  published_to_feed: boolean
  resolved_at: string | null
  automation_potential: number | null   // 1–5
  implementation_effort: ImplementationEffort | null
  review_category: ReviewCategory | null
  impact_level: Impact | null
  estimated_hours_saved_monthly: number | null
  // A1 additions
  ai_assisted: boolean
  ai_prefill: Record<string, unknown> | null
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
  visibility: Visibility
  // A1 additions
  kpi_area: KpiArea | null
  shoutout: string | null
}

export interface ExecutionPipelineItem {
  id: string
  created_at: string
  updated_at: string
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
  visibility: Visibility
  // A1 additions
  kpi_area: KpiArea | null
  solution_category: SolutionCategory | null
  submitter_notified_at: string | null
  project_id: string | null
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
  ai_assisted: boolean | null
  ai_prefill: Record<string, unknown> | null
}

// ─── New Interfaces (A1) ─────────────────────────────────────────────────────

export interface Project {
  id: string
  title: string
  description: string | null
  status: ProjectStatus
  visibility: ProjectVisibility
  kpi_area: KpiArea | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OperatorTask {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  kpi_area: KpiArea | null
  project_id: string | null
  source: TaskSource
  promote_to_pipeline: boolean
  created_at: string
  completed_at: string | null
}

export interface ScratchpadNote {
  id: string
  title: string
  content_md: string | null
  kpi_area: KpiArea | null
  is_private: boolean
  created_at: string
  updated_at: string
}

export interface LabSession {
  id: string
  input_text: string
  kpi_area: KpiArea | null
  linked_submission_id: string | null
  linked_project_id: string | null
  ai_output: string | null
  automation_score: number | null
  saved_to_notes: boolean
  promoted_to_pipeline: boolean
  created_at: string
}

export interface SopDraft {
  id: string
  source_submission_id: string | null
  source_pipeline_id: string | null
  kpi_area: KpiArea | null
  title: string
  content_md: string | null
  status: SopStatus
  ai_drafted: boolean
  created_at: string
}

export interface ReportRun {
  id: string
  generated_at: string
  range_label: string | null
  kpi_summary: Record<string, unknown> | null
  narrative_md: string | null
  pdf_url: string | null
  sent_to: string[]
  status: ReportRunStatus
}

export interface PendingNotification {
  id: string
  submission_id: string | null
  submitter_email: string
  submitter_name: string | null
  subject: string
  body_html: string
  trigger_status: string
  sent_at: string | null
  dismissed_at: string | null
  created_at: string
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

export const VISIBILITY_LABELS: Record<Visibility, string> = {
  private: 'Private',
  internal: 'Internal',
  public: 'Public',
}

export const VISIBILITY_DESCRIPTIONS: Record<Visibility, string> = {
  private: 'Private — only visible to you',
  internal: 'Internal — appears in reports and dashboard',
  public: 'Public — appears on the team feed',
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

// ─── KPI urgency colour ──────────────────────────────────────────────────────

export function urgencyColor(score: number | null): string {
  if (score == null) return 'text-white/40'
  if (score >= 7) return 'text-danger'
  if (score >= 4) return 'text-gold'
  return 'text-success'
}
