import { useState, useEffect } from 'react'
import TableCard from './TableCard'
import TableRow from './TableRow'
import TableCell from './TableCell'
import StatusBadge from './StatusBadge'
import { getRecentSurveys } from '../services/surveyService'
import { useLanguage } from '../contexts/LanguageContext'

export default function RecentSurveysTable() {
  const { t } = useLanguage()
  const [surveys, setSurveys] = useState([])

  useEffect(() => {
    getRecentSurveys().then(setSurveys).catch(console.error)
  }, [])

  return (
    <TableCard title={t('surveys.title')}>
      <table className="w-full border-collapse table-fixed min-w-[640px]">
        <colgroup>
          <col style={{ width: '16%' }} />
          <col style={{ width: '36%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '10%' }} />
        </colgroup>
        <thead>
          <TableRow isHeader>
            <TableCell header>{t('surveys.local')}</TableCell>
            <TableCell header>{t('surveys.file')}</TableCell>
            <TableCell header>{t('surveys.status')}</TableCell>
            <TableCell header>{t('surveys.date')}</TableCell>
            <TableCell header align="center">{t('surveys.surveys')}</TableCell>
            <TableCell header align="right">{t('surveys.metragem')}</TableCell>
          </TableRow>
        </thead>
        <tbody>
          {surveys.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-sm text-ink-400">
                {t('surveys.empty')}
              </td>
            </tr>
          )}
          {surveys.map((row, i) => (
            <TableRow key={row.id} isLast={i === surveys.length - 1}>
              <TableCell bold>
                {row.local}
              </TableCell>
              <TableCell>
                <span
                  className="block truncate text-xs font-mono text-ink-700"
                  title={row.file}
                >
                  {row.file}
                </span>
              </TableCell>
              <TableCell>
                <StatusBadge variant={row.status.variant}>
                  {t('status.' + row.status.variant)}
                </StatusBadge>
              </TableCell>
              <TableCell muted>{row.date}</TableCell>
              <TableCell align="center">{row.surveys}</TableCell>
              <TableCell align="right">{row.metering}</TableCell>
            </TableRow>
          ))}
        </tbody>
      </table>
    </TableCard>
  )
}
