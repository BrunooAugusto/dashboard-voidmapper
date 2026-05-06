import { cn } from '../../lib/cn'

export default function AuthCard({ children, className }) {
  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center p-6">
      <div
        className={cn(
          'w-full bg-surface rounded-[12px] border border-border-soft',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}
