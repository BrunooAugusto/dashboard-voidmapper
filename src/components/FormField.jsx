import { cn } from '../lib/cn'

export default function FormField({ label, children, className }) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <label className="text-sm font-medium text-ink-900 leading-none">{label}</label>
      {children}
    </div>
  )
}
