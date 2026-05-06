import { cn } from '../lib/cn'

export default function LinkAction({ children, onClick, className, as: Tag = 'button' }) {
  const props = Tag === 'button' ? { type: 'button', onClick } : {}
  return (
    <Tag
      {...props}
      className={cn(
        'inline-flex items-center text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
