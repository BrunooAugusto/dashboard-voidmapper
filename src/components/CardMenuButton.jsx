import { MoreVertical } from 'lucide-react'

export default function CardMenuButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open menu"
      className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-ink-400 hover:text-ink-700 hover:bg-page transition-colors"
    >
      <MoreVertical className="w-5 h-5" strokeWidth={2} />
    </button>
  )
}
