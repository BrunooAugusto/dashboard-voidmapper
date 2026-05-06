import { MoreVertical } from 'lucide-react'

export default function CardMenuButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open menu"
      className="w-6 h-6 inline-flex items-center justify-center text-ink-400 hover:text-ink-700 transition-colors"
    >
      <MoreVertical className="w-5 h-5" strokeWidth={2} />
    </button>
  )
}
