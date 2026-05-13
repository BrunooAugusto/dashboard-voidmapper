import { cn } from '../lib/cn'

export default function KpiPill({ children, variant = 'light', onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-8 px-4 inline-flex items-center justify-center rounded-lg text-[13px] font-semibold leading-none whitespace-nowrap cursor-pointer',
        'transition-all duration-150',
        variant === 'light' && [
          'bg-white text-zinc-900',
          'border border-black/10 shadow-sm',
          'hover:bg-zinc-50 hover:shadow hover:scale-[1.02]',
        ].join(' '),
        variant === 'dark' && [
          'bg-[#111] text-white',
          'shadow-sm',
          'hover:bg-zinc-800 hover:shadow-md hover:scale-[1.02]',
        ].join(' '),
        className,
      )}
    >
      {children}
    </button>
  )
}
