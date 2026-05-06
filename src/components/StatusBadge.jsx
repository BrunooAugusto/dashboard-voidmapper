import { cn } from '../lib/cn'

const VARIANTS = {
  success: 'bg-success-bg text-success-fg',
  danger: 'bg-danger-bg text-danger-fg',
  warning: 'bg-warning-bg text-warning-fg',
  info: 'bg-info-bg text-info-fg',
  neutral: 'bg-page text-ink-700',
}

const SIZES = {
  sm: 'h-[22px] px-2 text-xs',
  md: 'h-[28px] px-4 text-sm',
}

export default function StatusBadge({ variant = 'neutral', size = 'sm', children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium leading-none whitespace-nowrap',
        SIZES[size],
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
