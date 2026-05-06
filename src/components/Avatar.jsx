import { cn } from '../lib/cn'

export default function Avatar({ initials, src, alt, size = 40, className }) {
  const dims = { width: size, height: size }

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        style={dims}
        className={cn('rounded-full object-cover', className)}
      />
    )
  }

  return (
    <div
      style={dims}
      className={cn(
        'rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold',
        className,
      )}
    >
      {initials}
    </div>
  )
}
