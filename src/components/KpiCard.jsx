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
        'h-[157px] rounded-[12px] p-4 flex flex-col',
        isAccent
          ? 'bg-brand-500 text-white shadow-[0_1px_2px_rgba(249,115,22,0.25)]'
          : 'bg-surface border border-border-soft text-ink-900',
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
              isAccent ? 'bg-white/20 text-white' : 'bg-page text-ink-700',
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
