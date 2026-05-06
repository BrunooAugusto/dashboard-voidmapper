import { cn } from '../lib/cn'

export default function FormInput({
  type = 'text',
  placeholder,
  value,
  onChange,
  className,
  ...props
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={cn(
        'h-[52px] w-full px-4 rounded-[10px] bg-input-bg border border-border-soft',
        'text-sm font-medium text-ink-900 placeholder:text-ink-400',
        'outline-none focus:border-brand-300 focus:bg-surface transition-colors',
        type === 'date' && 'text-ink-500',
        className,
      )}
      {...props}
    />
  )
}
