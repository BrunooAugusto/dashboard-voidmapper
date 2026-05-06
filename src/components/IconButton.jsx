import { cn } from '../lib/cn'

export default function IconButton({ icon: Icon, label, onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'w-10 h-10 inline-flex items-center justify-center rounded-full text-ink-500 hover:text-ink-900 hover:bg-page transition-colors',
        className,
      )}
    >
      <Icon className="w-6 h-6" strokeWidth={1.75} />
    </button>
  )
}
