import { cn } from '../lib/cn'

export default function KpiPill({ children, variant = 'light', onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-7 px-4 inline-flex items-center justify-center rounded-full text-[13px] font-medium leading-none whitespace-nowrap transition-colors',
        variant === 'light' && 'bg-white text-ink-900 hover:bg-white/80',
        variant === 'dark' && 'bg-ink-900 text-white hover:bg-ink-700',
        className,
      )}
    >
      {children}
    </button>
  )
}
