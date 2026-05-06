import { cn } from '../lib/cn'

export default function CardHeader({
  title,
  action,
  size = 'default',
  divider = true,
  className,
}) {
  const isCompact = size === 'compact'

  return (
    <>
      <div
        className={cn(
          'flex items-center justify-between gap-4',
          isCompact ? 'px-4 py-3' : 'px-6 py-5',
          className,
        )}
      >
        <h3
          className={cn(
            'font-semibold text-ink-900 leading-tight',
            isCompact ? 'text-base' : 'text-lg',
          )}
        >
          {title}
        </h3>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
      {divider && <div className="h-px bg-border-soft" />}
    </>
  )
}
