import { cn } from '../lib/cn'

export default function Card({ children, className }) {
  return (
    <div
      className={cn(
        'rounded-[12px] bg-surface border border-border-soft overflow-hidden flex flex-col',
        className,
      )}
    >
      {children}
    </div>
  )
}
