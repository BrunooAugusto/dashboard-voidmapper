import { cn } from '../lib/cn'

export default function NavItem({ icon: Icon, label, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group w-full h-11 px-3 flex items-center gap-3 rounded-lg transition-colors',
        active
          ? 'bg-brand-500 text-white shadow-sm'
          : 'text-ink-700 hover:bg-page',
      )}
    >
      <Icon
        className={cn(
          'w-6 h-6 shrink-0',
          active ? 'text-white' : 'text-ink-500 group-hover:text-ink-700',
        )}
        strokeWidth={1.75}
      />
      <span className="text-[15px] font-medium leading-6">{label}</span>
    </button>
  )
}
