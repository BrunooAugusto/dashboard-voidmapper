import { cn } from '../lib/cn'

export default function TableRow({
  children,
  isHeader = false,
  isLast = false,
  onClick,
  className,
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        isHeader ? 'h-11 bg-page/50' : 'h-[68px]',
        isLast ? '' : 'border-b border-border-soft',
        !isHeader && 'hover:bg-page/60 transition-colors',
        !isHeader && onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </tr>
  )
}
