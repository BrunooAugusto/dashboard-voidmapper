import { Search } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

export default function SearchInput({ placeholder, value, onChange }) {
  const { t } = useLanguage()
  return (
    <div className="relative w-[270px]">
      <Search
        className="absolute left-[14px] top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400"
        strokeWidth={1.75}
      />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder ?? t('common.search')}
        className="h-[43px] w-full pl-11 pr-4 rounded-full bg-page border border-border-soft text-sm text-ink-700 placeholder:text-ink-400 outline-none focus:border-brand-300 focus:bg-surface transition-colors"
      />
    </div>
  )
}
