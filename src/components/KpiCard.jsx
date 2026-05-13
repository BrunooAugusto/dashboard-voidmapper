import { cn } from '../lib/cn'

export default function KpiCard({
  variant = 'default',
  title,
  value,
  status,
  footer,
  className,
}) {
  const isAccent = variant === 'accent'

  return (
    <div
      className={cn(
        'h-[157px] rounded-[16px] p-4 flex flex-col',
        isAccent
          ? [
              'bg-gradient-to-br from-[#FF6B00] to-[#FF8A1F] text-white',
              'border border-white/15',
              'dark:shadow-[0_8px_40px_rgba(255,107,0,0.28)]',
            ].join(' ')
          : [
              'bg-surface border border-border-soft text-ink-900',
              'dark:shadow-[0_4px_24px_rgba(0,0,0,0.45)]',
            ].join(' '),
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className={cn(
            'text-base font-medium leading-[19px]',
            isAccent ? 'text-white' : 'text-ink-900',
          )}
        >
          {title}
        </h3>
        {status && (
          <span
            className={cn(
              'shrink-0 inline-flex items-center h-[22px] px-2 rounded-full text-xs font-medium',
              isAccent ? 'bg-black/20 text-white' : 'bg-page text-ink-700',
            )}
          >
            {status}
          </span>
        )}
      </div>

      <div
        className={cn(
          'mt-3 text-[34px] font-bold leading-[1.1] tracking-tight',
          isAccent ? 'text-white' : 'text-ink-900',
        )}
      >
        {value}
      </div>

      <div className="mt-auto">{footer}</div>
    </div>
  )
}
