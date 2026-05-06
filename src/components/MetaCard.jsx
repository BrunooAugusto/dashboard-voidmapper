import { cn } from '../lib/cn'

export default function MetaCard({ label, value, className }) {
  return (
    <div
      className={cn(
        'bg-page border border-border-soft rounded-lg p-3 flex flex-col gap-1.5',
        className,
      )}
    >
      <span className="text-[11px] font-medium text-ink-500 leading-none">{label}</span>
      <span className="text-sm font-semibold text-ink-900 leading-snug">{value}</span>
    </div>
  )
}
