import { ArrowLeft } from 'lucide-react'
import TableCard from './TableCard'
import TableRow from './TableRow'
import TableCell from './TableCell'
import { MONITORING_ROWS } from '../data/dashboard'
import { useLanguage } from '../contexts/LanguageContext'

export default function MonitoringPage({ onBack }) {
  const { t } = useLanguage()

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
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

      <TableCard title={t('monitoring.tableTitle')}>
        <table className="w-full border-collapse">
          <thead>
            <TableRow isHeader>
              <TableCell header className="w-[120px]">{t('monitoring.area')}</TableCell>
              <TableCell header>{t('monitoring.project')}</TableCell>
              <TableCell header align="center" className="w-[180px]">
                {t('monitoring.frequency')}
              </TableCell>
              <TableCell header className="w-[190px]">{t('monitoring.lastSurvey')}</TableCell>
              <TableCell header align="center" className="w-[180px]">
                {t('monitoring.surveyCount')}
              </TableCell>
              <TableCell header align="center" className="w-[220px]">
                {t('monitoring.daysUntilNext')}
              </TableCell>
            </TableRow>
          </thead>
          <tbody>
            {MONITORING_ROWS.map((row, i) => {
              const isOverdue = row.daysUntilNext > row.frequencyDays
              const isLast = i === MONITORING_ROWS.length - 1
              return (
                <TableRow key={i} isLast={isLast}>
                  <TableCell bold className="w-[120px]">{row.area}</TableCell>
                  <TableCell muted>{row.project}</TableCell>
                  <TableCell muted align="center" className="w-[180px]">
                    {row.frequencyDays}
                  </TableCell>
                  <TableCell className="w-[190px]">{row.lastSurvey}</TableCell>
                  <TableCell muted align="center" className="w-[180px]">
                    {row.surveys}
                  </TableCell>
                  <td
                    className={[
                      'px-6 align-middle text-sm text-center w-[220px]',
                      isLast ? '' : 'border-b border-border-soft',
                      isOverdue
                        ? 'bg-danger-fg/90 text-white font-semibold'
                        : 'text-ink-900',
                    ].join(' ')}
                  >
                    {row.daysUntilNext}
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
