import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronRight, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { cn } from '../lib/cn'
import Card from './Card'
import { useLanguage } from '../contexts/LanguageContext'

export default function FolderSection({ folder, count, expanded, onToggle, onRename, onDelete, onDrop, canRename, canDelete, children }) {
  const { t } = useLanguage()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    function handle(e) {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [menuOpen])

  const label = count === 1 ? t('projects.folder.project') : t('projects.folder.projects')
  const showMenu = canRename || canDelete

  return (
    <Card
      className={cn('mb-4 transition-colors', dragOver && 'ring-2 ring-brand-500')}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); onDrop(e) }}
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-2 min-w-0 flex-1 text-left"
        >
          {expanded
            ? <ChevronDown className="w-4 h-4 text-ink-500 shrink-0" strokeWidth={2} />
            : <ChevronRight className="w-4 h-4 text-ink-500 shrink-0" strokeWidth={2} />}
          <span className="text-sm font-semibold text-ink-900 truncate">{folder.name}</span>
          <span className="text-xs text-ink-400 shrink-0">{count} {label}</span>
        </button>

        {showMenu && (
          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v) }}
              className="w-7 h-7 flex items-center justify-center rounded-md text-ink-400 hover:bg-page hover:text-ink-700 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" strokeWidth={2} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 z-20 min-w-[160px] bg-surface border border-border-soft rounded-[10px] shadow-lg overflow-hidden">
                {canRename && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onRename() }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-ink-700 hover:bg-page transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                    {t('projects.folder.rename')}
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete() }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-danger-fg hover:bg-danger-bg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                    {t('projects.folder.delete')}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t border-border-soft">
          {count > 0 ? (
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 4xl:grid-cols-4 5xl:grid-cols-5 gap-4 3xl:gap-5 4xl:gap-6">
              {children}
            </div>
          ) : (
            <div className="px-6 py-8 flex items-center justify-center text-ink-400 text-sm">
              {t('projects.folder.empty')}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
