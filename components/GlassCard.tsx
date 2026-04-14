import { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  highlighted?: boolean
  className?: string
  leftAccent?: boolean
}

export default function GlassCard({
  children,
  highlighted = false,
  className = '',
  leftAccent = false,
}: GlassCardProps) {
  return (
    <div
      className={[
        'glass-card',
        highlighted ? 'glass-card--highlighted' : '',
        leftAccent ? 'glass-card--left-accent' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}
