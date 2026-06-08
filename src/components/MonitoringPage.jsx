import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, MoreHorizontal, Trash2 } from 'lucide-react'
import TableCard from './TableCard'
import TableRow from './TableRow'
import TableCell from './TableCell'
import ConfirmModal from './ConfirmModal'
import { cn } from '../lib/cn'
import { getMonitoringRows, deleteMonitoringRow, createMonitoringRow } from '../services/monitoringService'
import { useLanguage } from '../contexts/LanguageContext'

// ── Helpers ──────────────────────────────────────────────────────────────────

function getDaysStatus(days) {
  if (days === null || days === undefined) return 'neutral'
  if (days <= 0) return 'danger'
  if (days <= 3) return 'warning'
  return 'success'
}

function formatDaysLabel(days) {
  if (days === null || days === undefined) return '—'
  if (days === 0) return 'Hoje'
  if (days > 0) return `${days} dia${days === 1 ? '' : 's'}`
  const n = Math.abs(days)
  return `Vencido há ${n} dia${n === 1 ? '' : 's'}`
}

const BADGE_CLASS = {
  success: 'bg-success-bg text-success-fg',
  warning: 'bg-warning-bg text-warning-fg',
  danger:  'bg-danger-bg text-danger-fg',
  neutral: 'bg-page text-ink-400',
}
const DOT_CLASS = {
  success: 'bg-success-fg',
  warning: 'bg-warning-fg',
  danger:  'bg-danger-fg',
  neutral: 'bg-ink-300',
}

function resolveCanDelete(user) {
  if (!user?.appRole) return true
  return ['admin', 'gestor'].includes(user.appRole)
}

// ── Portal dropdown — renders on document.body to escape overflow clipping ───

function ActionsMenu({ onDelete, canDelete }) {
  const [open, setOpen] = useState(false)
  const [pos,  setPos]  = useState({ top: 0, right: 0 })
  const btnRef  = useRef(null)
  const menuRef = useRef(null)

  function openMenu() {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    function onDown(e) {
      if (!btnRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) {
        setOpen(false)
      }
    }
    function onScroll() { setOpen(false) }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={openMenu}
        className="w-8 h-8 flex items-center justify-center rounded-full text-ink-400 hover:bg-page hover:text-ink-700 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" strokeWidth={2} />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 9999 }}
          className="min-w-[160px] bg-surface border border-border-soft rounded-[10px] shadow-2xl overflow-hidden"
        >
          {canDelete && (
            <>
              <button
                type="button"
                onClick={() => { setOpen(false); onDelete() }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-danger-fg hover:bg-danger-bg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                Excluir Monitoramento
              </button>
            </>
          )}
        </div>,
        document.body,
      )}
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MonitoringPage({ onBack, onSelectRow, onNew, user }) {
  const { t } = useLanguage()
  const [rows,         setRows]         = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)
  const [toast,        setToast]        = useState(null)

  const canDelete = resolveCanDelete(user)

  useEffect(() => {
    getMonitoringRows().then(setRows).catch(console.error)
  }, [])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteMonitoringRow(deleteTarget.id)
      setRows(prev => prev.filter(r => r.id !== deleteTarget.id))
      setDeleteTarget(null)
      showToast('Monitoramento excluído com sucesso')
    } catch (err) {
      console.error('[monitoring] delete error:', err)
      showToast('Erro ao excluir monitoramento', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
            {t('monitoring.back')}
          </button>
          <span className="text-ink-400 text-sm">/</span>
          <span className="text-sm font-semibold text-ink-900">{t('monitoring.breadcrumb')}</span>
        </div>
        <button
          type="button"
          onClick={onNew}
          className="h-9 px-5 bg-brand-500 text-white text-sm font-semibold rounded-full whitespace-nowrap hover:bg-brand-600 transition-colors"
        >
          {t('monitoring.newButton')}
        </button>
      </div>

      <TableCard title={t('monitoring.tableTitle')}>
        <table className="w-full border-collapse table-fixed min-w-[640px]">
          <colgroup>
            <col style={{ width: '11%' }} />
            <col style={{ width: '23%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '17%' }} />
            <col style={{ width: '90px' }} />
          </colgroup>
          <thead>
            <TableRow isHeader>
              <TableCell header>{t('monitoring.area')}</TableCell>
              <TableCell header>{t('monitoring.project')}</TableCell>
              <TableCell header align="center">{t('monitoring.frequency')}</TableCell>
              <TableCell header>{t('monitoring.lastSurvey')}</TableCell>
              <TableCell header align="center">{t('monitoring.surveyCount')}</TableCell>
              <TableCell header align="center">{t('monitoring.daysUntilNext')}</TableCell>
              <TableCell header align="center">Ações</TableCell>
            </TableRow>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-ink-400">
                  {t('monitoring.empty')}
                </td>
              </tr>
            )}
            {rows.map((row, i) => {
              const status = getDaysStatus(row.daysUntilNext)
              const label  = formatDaysLabel(row.daysUntilNext)
              const isLast = i === rows.length - 1
              return (
                <TableRow key={row.id ?? i} isLast={isLast} onClick={() => onSelectRow?.(row)}>
                  <TableCell bold>{row.area}</TableCell>
                  <TableCell muted>{row.project}</TableCell>
                  <TableCell muted align="center">{row.frequencyDays}</TableCell>
                  <TableCell>{row.lastSurvey}</TableCell>
                  <TableCell muted align="center">{row.surveys}</TableCell>

                  {/* Status badge */}
                  <td className="px-4 py-2.5 align-middle text-center">
                    <span className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap',
                      BADGE_CLASS[status],
                    )}>
                      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', DOT_CLASS[status])} />
                      {label}
                    </span>
                  </td>

                  {/* Actions — portal dropdown, never clipped by overflow */}
                  <td
                    className="py-2.5 align-middle text-center"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-center">
                      <ActionsMenu
                        canDelete={canDelete}
  
                        onDelete={() => setDeleteTarget(row)}
                      />
                    </div>
                  </td>
                </TableRow>
              )
            })}
          </tbody>
        </table>
      </TableCard>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <ConfirmModal
          message="Tem certeza que deseja excluir este monitoramento? Esta ação não pode ser desfeita."
          onConfirm={handleDeleteConfirm}
          onCancel={() => { if (!deleting) setDeleteTarget(null) }}
          loading={deleting}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-xl pointer-events-none whitespace-nowrap',
            toast.type === 'error' ? 'bg-danger-fg' : 'bg-ink-900',
          )}
        >
          {toast.msg}
        </div>
      )}
    </>
  )
}