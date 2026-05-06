import TableCard from './TableCard'
import TableRow from './TableRow'
import TableCell from './TableCell'
import StatusBadge from './StatusBadge'
import { RECENT_SURVEYS } from '../data/dashboard'
import { useLanguage } from '../contexts/LanguageContext'

export default function RecentSurveysTable() {
  const { t } = useLanguage()
  return (
    <TableCard title={t('surveys.title')}>
      <table className="w-full border-collapse">
        <thead>
          <TableRow isHeader>
            <TableCell header className="w-[160px]">{t('surveys.local')}</TableCell>
            <TableCell header>{t('surveys.file')}</TableCell>
            <TableCell header className="w-[130px]">{t('surveys.status')}</TableCell>
            <TableCell header className="w-[120px]">{t('surveys.date')}</TableCell>
            <TableCell header align="center" className="w-[140px]">{t('surveys.surveys')}</TableCell>
            <TableCell header align="right" className="w-[120px]">{t('surveys.metragem')}</TableCell>
          </TableRow>
        </thead>
        <tbody>
          {RECENT_SURVEYS.map((row, i) => (
            <TableRow key={row.id} isLast={i === RECENT_SURVEYS.length - 1}>
              <TableCell bold className="w-[160px]">
                {row.local}
              </TableCell>
              <TableCell className="max-w-0">
                <span
                  className="block truncate text-xs font-mono text-ink-700"
                  title={row.file}
                >
                  {row.file}
                </span>
              </TableCell>
              <TableCell className="w-[130px]">
                <StatusBadge variant={row.status.variant}>
                  {t('status.' + row.status.variant)}
                </StatusBadge>
              </TableCell>
              <TableCell muted className="w-[120px]">
                {row.date}
              </TableCell>
              <TableCell align="center" className="w-[140px]">
                {row.surveys}
              </TableCell>
              <TableCell align="right" className="w-[120px]">
                {row.metering}
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </table>
    </TableCard>
  )
}
