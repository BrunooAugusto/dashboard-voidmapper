import { useState, useEffect, useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import Card from './Card'
import SurveyAreaChart from './WeeklyBarChart'
import { cn } from '../lib/cn'
import { SURVEY_ANALYTICS_DATA, MONTHLY_ANALYTICS } from '../data/dashboard'
import { getSurveyAnalytics } from '../services/surveyService'
import { useLanguage } from '../contexts/LanguageContext'

const PERIODS = ['weekly', 'monthly', 'annual']

export default function WeeklyChartCard() {
  const { t, lang } = useLanguage()
  const [period, setPeriod]               = useState('weekly')
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth())
  const [chartData, setChartData]         = useState(null)
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    setLoading(true)
    const month = period === 'monthly' ? selectedMonth : undefined
    getSurveyAnalytics(period, month)
      .then(setChartData)
      .catch(() => {
        if (period === 'monthly') setChartData(MONTHLY_ANALYTICS[selectedMonth])
        else setChartData(SURVEY_ANALYTICS_DATA[period] ?? SURVEY_ANALYTICS_DATA.weekly)
      })
      .finally(() => setLoading(false))
  }, [period, selectedMonth])

  const monthNames = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const name = new Intl.DateTimeFormat(lang === 'pt-BR' ? 'pt-BR' : 'en-US', { month: 'long' })
          .format(new Date(2024, i, 1))
        return name.charAt(0).toUpperCase() + name.slice(1)
      }),
    [lang],
  )

  const activeData = chartData ?? (
    period === 'monthly'
      ? MONTHLY_ANALYTICS[selectedMonth]
      : SURVEY_ANALYTICS_DATA[period] ?? SURVEY_ANALYTICS_DATA.weekly
  )

  return (
    <Card className="h-[320px] 3xl:h-[360px] 4xl:h-[400px] 5xl:h-[440px]">

      {/* Header */}
      <div className="px-4 py-3 flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-border-soft shrink-0">
        <div>
          <h3 className="text-base font-semibold text-ink-900 leading-tight">
            {t('chart.title')}
          </h3>
          <p className="text-xs text-ink-400 mt-0.5 leading-tight">
            {t('chart.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">

          {/* Period tabs */}
          <div className="flex items-center rounded-lg bg-page p-0.5 gap-0.5">
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={cn(
                  'h-7 px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                  period === p
                    ? 'bg-surface text-ink-900 border border-border-soft'
                    : 'text-ink-500 hover:text-ink-700',
                )}
              >
                {t(`chart.tab.${p}`)}
              </button>
            ))}
          </div>

          {/* Month selector — only in monthly mode */}
          {period === 'monthly' && (
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className={cn(
                  'h-7 pl-3 pr-7 rounded-md text-xs font-medium appearance-none cursor-pointer',
                  'bg-surface border border-border-soft text-ink-700',
                  'outline-none focus:border-brand-300 transition-colors',
                  'w-[124px]',
                )}
              >
                {monthNames.map((name, i) => (
                  <option key={i} value={i}>{name}</option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-ink-400 pointer-events-none"
                strokeWidth={2.5}
              />
            </div>
          )}

        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-ink-400 bg-surface/60 z-10">
            Carregando...
          </div>
        )}
        <SurveyAreaChart data={activeData} />
      </div>

    </Card>
  )
}
