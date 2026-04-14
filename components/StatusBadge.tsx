import {
  SubmissionStatus,
  Impact,
  Department,
  STATUS_LABELS,
  IMPACT_LABELS,
  DEPARTMENT_LABELS,
} from '@/lib/types'

// ─── Status Badge ─────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: SubmissionStatus
  size?: 'sm' | 'md'
}

const STATUS_PILL_CLASSES: Record<SubmissionStatus, string> = {
  new: 'badge-new',
  reviewing: 'badge-reviewing',
  accepted: 'badge-accepted',
  in_progress: 'badge-in-progress',
  rejected: 'badge-rejected',
  implemented: 'badge-implemented',
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  return (
    <span className={`badge ${STATUS_PILL_CLASSES[status]} ${size === 'sm' ? 'badge-sm' : ''}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

// ─── Impact Badge ─────────────────────────────────────────────────────────────

interface ImpactBadgeProps {
  impact: Impact
  size?: 'sm' | 'md'
}

const IMPACT_PILL_CLASSES: Record<Impact, string> = {
  low: 'badge-impact-low',
  medium: 'badge-impact-medium',
  high: 'badge-impact-high',
}

export function ImpactBadge({ impact, size = 'md' }: ImpactBadgeProps) {
  return (
    <span className={`badge ${IMPACT_PILL_CLASSES[impact]} ${size === 'sm' ? 'badge-sm' : ''}`}>
      {IMPACT_LABELS[impact]} Impact
    </span>
  )
}

// ─── Department Badge ─────────────────────────────────────────────────────────

interface DeptBadgeProps {
  department: Department
  size?: 'sm' | 'md'
}

export function DeptBadge({ department, size = 'md' }: DeptBadgeProps) {
  return (
    <span className={`badge badge-dept ${size === 'sm' ? 'badge-sm' : ''}`}>
      {DEPARTMENT_LABELS[department]}
    </span>
  )
}
