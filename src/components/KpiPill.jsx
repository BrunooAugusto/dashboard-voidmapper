import { cn } from '../lib/cn'

export default function KpiPill({ children, variant = 'light', onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-7 px-4 inline-flex items-center justify-center rounded-full text-[13px] font-medium leading-none whitespace-nowrap transition-colors',
        // light: always white bg — used on orange accent card, needs fixed dark text
        variant === 'light' && 'bg-white text-gray-900 hover:bg-white/85',
        // dark: semi-transparent black — works on any colored background
        variant === 'dark' && 'bg-black/30 text-white border border-white/20 hover:bg-black/45',
        className,
      )}
    >
      {children}
    </button>
  )
}
