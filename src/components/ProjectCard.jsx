import { useState, useRef, useEffect } from 'react'
import { MoreHorizontal, Trash2, FolderMinus } from 'lucide-react'
import StatusBadge from './StatusBadge'
import { useLanguage } from '../contexts/LanguageContext'

export default function ProjectCard({ project, onClick, onDelete, canDelete = true, onRemoveFromFolder }) {
  const { t } = useLanguage()
  const label = project.surveys === 1 ? t('projects.survey') : t('projects.surveys')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    function handle(e) {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [menuOpen])

  const showRemoveFromFolder = Boolean(onRemoveFromFolder && project.folderId)
  const showMenu = canDelete || showRemoveFromFolder

  return (
    <div
      onClick={onClick}
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(project.id)) }}
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

        {/* Three-dots button — only shown when there's at least one menu action available */}
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
              {showRemoveFromFolder && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onRemoveFromFolder?.(project.id) }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-ink-700 hover:bg-page transition-colors"
                >
                  <FolderMinus className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                  {t('projects.folder.removeFromFolder')}
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete?.(project.id) }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-danger-fg hover:bg-danger-bg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                  Deletar projeto
                </button>
              )}
            </div>
          )}
        </div>
        )}
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
