import { ChevronDown } from 'lucide-react'
import Avatar from './Avatar'

export default function AccountMenu({ name, email, initials, avatarSrc, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-10 inline-flex items-center gap-3 pr-1 hover:bg-page rounded-full transition-colors"
    >
      {avatarSrc ? (
        <img src={avatarSrc} alt="Avatar" className="w-10 h-10 rounded-full object-cover shrink-0" />
      ) : (
        <Avatar initials={initials} size={40} className="bg-brand-500 text-white" />
      )}
      <div className="text-left min-w-0">
        <div className="text-sm font-semibold text-ink-900 leading-[18px] truncate">
          {name}
        </div>
        <div className="text-sm text-ink-500 leading-[18px] truncate">{email}</div>
      </div>
      <ChevronDown className="w-3 h-3 text-ink-500 ml-1" strokeWidth={2} />
    </button>
  )
}
