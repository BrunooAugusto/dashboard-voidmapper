import { cn } from '../lib/cn'
import { useLanguage } from '../contexts/LanguageContext'

const OPTIONS = [
  { key: 'success' },
  { key: 'danger'  },
  { key: 'warning' },
  { key: 'info'    },
]

const SELECTED = {
  success: { wrap: 'bg-success-bg border-success-fg/30', text: 'text-success-fg', dot: 'bg-success-fg' },
  danger:  { wrap: 'bg-danger-bg  border-danger-fg/30',  text: 'text-danger-fg',  dot: 'bg-danger-fg'  },
  warning: { wrap: 'bg-warning-bg border-warning-fg/30', text: 'text-warning-fg', dot: 'bg-warning-fg' },
  info:    { wrap: 'bg-info-bg    border-info-fg/30',    text: 'text-info-fg',    dot: 'bg-info-fg'    },
}

export default function StatusPicker({ value, onChange }) {
  const { t } = useLanguage()
  return (
    <div className="grid grid-cols-2 gap-3">
      {OPTIONS.map((opt) => {
        const active = value === opt.key
        const s = SELECTED[opt.key]
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={cn(
              'h-[52px] flex items-center gap-2 px-4 rounded-[10px] border text-sm font-medium transition-colors',
              active
                ? cn(s.wrap, s.text)
                : 'bg-input-bg border-border-soft text-ink-400 hover:bg-page',
            )}
          >
            <span
              className={cn(
                'w-2.5 h-2.5 rounded-full shrink-0',
                active ? s.dot : 'bg-ink-300',
              )}
            />
            {t('status.' + opt.key)}
          </button>
        )
      })}
    </div>
  )
}
