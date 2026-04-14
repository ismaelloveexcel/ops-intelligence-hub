interface ImpactDotProps {
  active?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function ImpactDot({
  active = true,
  size = 'md',
  className = '',
}: ImpactDotProps) {
  const sizeMap = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  }

  if (!active) {
    return (
      <span
        className={`inline-block rounded-full bg-white/20 ${sizeMap[size]} ${className}`}
      />
    )
  }

  return (
    <span
      className={`inline-block rounded-full bg-teal ${sizeMap[size]} dot-glow ${className}`}
    />
  )
}
