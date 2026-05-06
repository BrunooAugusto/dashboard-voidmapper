import { cn } from '../lib/cn'

export default function TableRow({
  children,
  isHeader = false,
  isLast = false,
  className,
}) {
  return (
    <tr
      className={cn(
        isHeader ? 'h-11' : 'h-[72px]',
        isLast ? '' : 'border-b border-border-soft',
        !isHeader && 'hover:bg-page/60 transition-colors',
        className,
      )}
    >
      {children}
    </tr>
  )
}
