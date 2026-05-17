import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import TableCard from './TableCard'
import TableRow from './TableRow'
import TableCell from './TableCell'
import { cn } from '../lib/cn'
import { getMonitoringRows } from '../services/monitoringService'
import { useLanguage } from '../contexts/LanguageContext'

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

export default function MonitoringPage({ onBack, onSelectRow, onNew }) {
  const { t } = useLanguage()
  const [rows, setRows] = useState([])

  useEffect(() => {
    getMonitoringRows().then(setRows).catch(console.error)
  }, [])

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
            <col style={{ width: '12%' }} />
            <col style={{ width: '28%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '18%' }} />
          </colgroup>
          <thead>
            <TableRow isHeader>
              <TableCell header>{t('monitoring.area')}</TableCell>
              <TableCell header>{t('monitoring.project')}</TableCell>
              <TableCell header align="center">{t('monitoring.frequency')}</TableCell>
              <TableCell header>{t('monitoring.lastSurvey')}</TableCell>
              <TableCell header align="center">{t('monitoring.surveyCount')}</TableCell>
              <TableCell header align="center">{t('monitoring.daysUntilNext')}</TableCell>
            </TableRow>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-ink-400">
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
                  <td className="px-4 py-2.5 align-middle text-center">
                    <span className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap',
                      BADGE_CLASS[status],
                    )}>
                      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', DOT_CLASS[status])} />
                      {label}
                    </span>
                  </td>
                </TableRow>
              )
            })}
          </tbody>
        </table>
      </TableCard>
    </>
  )
}
