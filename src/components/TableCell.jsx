import { cn } from '../lib/cn'

const ALIGN = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

export default function TableCell({
  children,
  header = false,
  align = 'left',
  muted = false,
  bold = false,
  className,
}) {
  const Tag = header ? 'th' : 'td'

  return (
    <Tag
      className={cn(
        'px-4 align-middle',
        ALIGN[align],
        header
          ? 'text-sm font-medium text-ink-500'
          : 'text-sm text-ink-900',
        !header && muted && 'text-ink-500 font-normal',
        !header && bold && 'font-semibold text-ink-900',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
