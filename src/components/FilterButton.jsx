import { ChevronDown } from 'lucide-react'
import { cn } from '../lib/cn'

export default function FilterButton({ label = 'Filtrar por', onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-[26px] inline-flex items-center gap-2 pl-3 pr-2 rounded-md border border-border-soft bg-surface text-[12px] font-medium text-ink-700 hover:bg-page transition-colors',
        className,
      )}
    >
      <span>{label}</span>
      <ChevronDown className="w-3 h-3 text-ink-500" strokeWidth={2} />
    </button>
  )
}
