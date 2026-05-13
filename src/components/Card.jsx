import { cn } from '../lib/cn'

export default function Card({ children, className }) {
  return (
    <div
      className={cn(
        'rounded-[16px] bg-surface border border-border-soft overflow-hidden flex flex-col',
        'dark:shadow-[0_4px_24px_rgba(0,0,0,0.45)]',
        className,
      )}
    >
      {children}
    </div>
  )
}
