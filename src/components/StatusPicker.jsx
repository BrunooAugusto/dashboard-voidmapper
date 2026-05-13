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

// value: string[]   onChange: (next: string[]) => void
export default function StatusPicker({ value = [], onChange }) {
  const { t } = useLanguage()
  const atMax = value.length >= 3

  function toggle(key) {
    if (value.includes(key)) {
      // always allow deselection, but keep at least 1
      if (value.length === 1) return
      onChange(value.filter(v => v !== key))
    } else {
      if (atMax) return
      onChange([...value, key])
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map((opt) => {
          const active = value.includes(opt.key)
          const s = SELECTED[opt.key]
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => toggle(opt.key)}
              className={cn(
                'h-[52px] flex items-center gap-2 px-4 rounded-[10px] border text-sm font-medium transition-colors',
                active
                  ? cn(s.wrap, s.text)
                  : !active && atMax
                    ? 'bg-input-bg border-border-soft text-ink-300 cursor-not-allowed'
                    : 'bg-input-bg border-border-soft text-ink-400 hover:bg-page',
              )}
            >
              <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', active ? s.dot : 'bg-ink-300')} />
              {t('status.' + opt.key)}
            </button>
          )
        })}
      </div>
      {atMax && (
        <p className="text-xs text-warning-fg">Selecione no máximo 3 status.</p>
      )}
    </div>
  )
}
