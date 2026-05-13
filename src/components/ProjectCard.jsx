import { useState, useRef, useEffect } from 'react'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import StatusBadge from './StatusBadge'
import { useLanguage } from '../contexts/LanguageContext'
import { cn } from '../lib/cn'

export default function ProjectCard({ project, onClick, onDelete }) {
  const { t } = useLanguage()
  const label = project.surveys === 1 ? t('projects.survey') : t('projects.surveys')
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const menuRef = useRef(null)

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    function handle(e) {
      if (!menuRef.current?.contains(e.target)) {
        setMenuOpen(false)
        setConfirming(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [menuOpen])

  async function handleDelete(e) {
    e.stopPropagation()
    setDeleting(true)
    try {
      await onDelete?.(project.id)
    } finally {
      setDeleting(false)
      setMenuOpen(false)
      setConfirming(false)
    }
  }

  return (
    <div
      onClick={onClick}
      className="relative border border-border-soft rounded-[16px] p-4 flex flex-col gap-[10px] bg-surface hover:border-border transition-all cursor-pointer"
    >
      {/* Status badges + three-dots */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-nowrap gap-1.5 overflow-hidden">
          {project.statuses.map((s, i) => (
            <StatusBadge key={i} variant={s.variant} size="md">
              {t('status.' + s.variant)}
            </StatusBadge>
          ))}
        </div>

        {/* Three-dots button */}
        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); setConfirming(false) }}
            className="w-7 h-7 flex items-center justify-center rounded-md text-ink-400 hover:bg-page hover:text-ink-700 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" strokeWidth={2} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-8 z-20 min-w-[160px] bg-surface border border-border-soft rounded-[10px] shadow-lg overflow-hidden">
              {!confirming ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setConfirming(true) }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-danger-fg hover:bg-danger-bg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                  Deletar projeto
                </button>
              ) : (
                <div onClick={e => e.stopPropagation()} className="p-3 flex flex-col gap-2">
                  <p className="text-xs font-medium text-ink-700">Tem certeza? Esta ação não pode ser desfeita.</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className={cn(
                        'flex-1 h-7 rounded-md bg-danger-bg text-danger-fg text-xs font-semibold transition-colors',
                        deleting ? 'opacity-50' : 'hover:brightness-95',
                      )}
                    >
                      {deleting ? '...' : 'Deletar'}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setConfirming(false) }}
                      className="flex-1 h-7 rounded-md border border-border-soft text-ink-600 text-xs font-medium hover:bg-page transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Project info */}
      <div className="flex flex-col gap-[6px]">
        <p className="text-[22px] font-medium text-ink-900 leading-[1.4]">{project.code}</p>
        <p className="text-sm text-ink-500 leading-[1.4]">{project.date}</p>
        <p className="text-sm text-ink-500 leading-[1.4]">
          {project.surveys} {label}
          {project.level != null && (
            <span className="ml-2 text-xs font-medium text-ink-400">· Nível {project.level}</span>
          )}
        </p>
      </div>
    </div>
  )
}
