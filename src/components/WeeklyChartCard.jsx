import { useState, useEffect, useMemo } from 'react'
import Card from './Card'
import SurveyAreaChart from './WeeklyBarChart'
import { cn } from '../lib/cn'
import { getSurveyAnalytics, getAvailableYears } from '../services/surveyService'
import { useLanguage } from '../contexts/LanguageContext'

const PERIODS = [
  { key: 'weekly',  label: 'Semanal' },
  { key: 'monthly', label: 'Mensal'  },
  { key: 'annual',  label: 'Anual'   },
]

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function buildFallback(period, { year, month, weekOffset }) {
  if (period === 'weekly') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dow = today.getDay()
    const daysToMon = dow === 0 ? 6 : dow - 1
    const monday = new Date(today)
    monday.setDate(today.getDate() - daysToMon + weekOffset * 7)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return {
        label: `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`,
        metragem: 0,
        count: 0,
      }
    })
  }
  if (period === 'monthly') {
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const weekCount = Math.ceil(daysInMonth / 7)
    return Array.from({ length: weekCount }, (_, i) => ({ label: `Semana ${i + 1}`, metragem: 0, count: 0 }))
  }
  // annual
  return MONTH_NAMES.map(l => ({ label: l, metragem: 0, count: 0 }))
}

function getWeekRange(weekOffset) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dow = today.getDay()
  const daysToMon = dow === 0 ? 6 : dow - 1
  const start = new Date(today)
  start.setDate(today.getDate() - daysToMon + weekOffset * 7)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const fmt = d => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`
  return `${fmt(start)} — ${fmt(end)}`
}

export default function WeeklyChartCard() {
  const { t } = useLanguage()

  const nowYear  = new Date().getFullYear()
  const nowMonth = new Date().getMonth()

  const [period, setPeriod]               = useState('weekly')
  const [metric, setMetric]               = useState('metragem')
  const [selectedYear, setSelectedYear]   = useState(nowYear)
  const [selectedMonth, setSelectedMonth] = useState(nowMonth)
  const [weekOffset, setWeekOffset]       = useState(0)
  const [availableYears, setAvailableYears] = useState(() =>
    Array.from({ length: nowYear - 2024 + 1 }, (_, i) => 2024 + i)
  )
  const [chartData, setChartData] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  useEffect(() => {
    getAvailableYears().then(setAvailableYears).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    getSurveyAnalytics({ period, year: selectedYear, month: selectedMonth, weekOffset })
      .then(data => { setChartData(data); setLoading(false) })
      .catch(err  => { setError(err.message); setLoading(false) })
  }, [period, selectedYear, selectedMonth, weekOffset])

  const weekRange    = useMemo(() => getWeekRange(weekOffset), [weekOffset])
  const fallbackData = useMemo(
    () => buildFallback(period, { year: selectedYear, month: selectedMonth, weekOffset }),
    [period, selectedYear, selectedMonth, weekOffset],
  )
  const activeData = chartData ?? fallbackData

  const isEmpty = !loading && !error && activeData.every(d => {
    const v = metric === 'levantamentos' ? (d.count ?? 0) : (d.metragem ?? 0)
    return v === 0
  })

  const title    = metric === 'levantamentos' ? t('chart.titleLevantamentos') : t('chart.titleMetragem')
  const subtitle = t('chart.subtitleGrouped')

  return (
    <Card className="h-[390px] 3xl:h-[430px] 4xl:h-[470px] 5xl:h-[510px]">

      {/* Header */}
      <div className="px-4 py-3 flex flex-col gap-2 border-b border-border-soft shrink-0">

        {/* Row 1: title | year selector + metric toggle */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-ink-900 leading-tight truncate">{title}</h3>
            <p className="text-xs text-ink-400 mt-0.5 leading-tight">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Year selector — not applicable to weekly (navigated via offset) */}
            {period !== 'weekly' && (
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="h-7 px-2 text-xs rounded-lg border border-border-soft bg-surface text-ink-900 focus:outline-none focus:border-brand-400 transition-colors cursor-pointer"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            )}
            {/* Metric toggle */}
            <div className="flex items-center rounded-lg bg-page p-0.5 gap-0.5">
              {['metragem', 'levantamentos'].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetric(m)}
                  className={cn(
                    'h-7 px-2.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                    metric === m
                      ? 'bg-surface text-ink-900 border border-border-soft'
                      : 'text-ink-500 hover:text-ink-700',
                  )}
                >
                  {t(`chart.metric.${m}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: period tabs + month selector (monthly only) */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {PERIODS.map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setPeriod(tab.key)}
                className={cn(
                  'h-6 px-2.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                  period === tab.key
                    ? 'bg-brand-500 text-white'
                    : 'bg-page text-ink-500 hover:text-ink-700',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {period === 'monthly' && (
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="h-6 px-2 text-xs rounded-lg border border-border-soft bg-surface text-ink-900 focus:outline-none focus:border-brand-400 transition-colors cursor-pointer"
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i} value={i}>{name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Row 3: week navigation — weekly only */}
        {period === 'weekly' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWeekOffset(w => w - 1)}
              className="h-6 px-2 rounded-md bg-page text-xs text-ink-500 hover:text-ink-700 transition-colors"
            >
              ←
            </button>
            <span className="text-xs text-ink-700 font-medium">{weekRange}</span>
            <button
              type="button"
              onClick={() => setWeekOffset(w => w + 1)}
              disabled={weekOffset >= 0}
              className="h-6 px-2 rounded-md bg-page text-xs text-ink-500 hover:text-ink-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* Chart area */}
      <div className="flex-1 min-h-0 relative">

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-ink-400 bg-surface/60 z-10">
            Carregando...
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <span className="text-xs text-danger-fg bg-danger-bg/40 px-3 py-1.5 rounded-lg">
              Erro ao carregar dados
            </span>
          </div>
        )}

        {isEmpty && (
          <div className="absolute inset-0 flex items-end justify-center pb-12 z-10 pointer-events-none">
            <span className="text-[11px] text-ink-400 bg-surface/80 px-2.5 py-1 rounded-md">
              Nenhum levantamento no período
            </span>
          </div>
        )}

        <SurveyAreaChart data={activeData} metric={metric} />
      </div>

    </Card>
  )
}
