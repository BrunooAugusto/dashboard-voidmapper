import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, CalendarDays, Clock, ClipboardList } from 'lucide-react'
import Card from './Card'
import FormField from './FormField'
import FormInput from './FormInput'
import { cn } from '../lib/cn'
import { createMonitoringRow, updateMonitoringRow } from '../services/monitoringService'
import { supabase } from '../lib/supabase.js'
import { useLanguage } from '../contexts/LanguageContext'

// ── helpers ───────────────────────────────────────────────────────────────────

function formatDateBR(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function computeSchedule(latestSurveyDate, frequencyDays) {
  if (!latestSurveyDate || !frequencyDays) return { nextDate: null, daysLeft: null }
  const freq = parseInt(frequencyDays, 10)
  if (isNaN(freq) || freq <= 0) return { nextDate: null, daysLeft: null }
  const next = new Date(latestSurveyDate)
  next.setDate(next.getDate() + freq)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysLeft = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return { nextDate: next, daysLeft }
}

function getStatus(daysLeft) {
  if (daysLeft === null) return 'neutral'
  if (daysLeft <= 0) return 'danger'
  if (daysLeft <= 3) return 'warning'
  return 'success'
}

const STATUS_STYLE = {
  success: { badge: 'bg-success-bg text-success-fg', card: 'bg-success-bg border-success-fg/25', value: 'text-success-fg', dot: 'bg-green-500' },
  warning: { badge: 'bg-warning-bg text-warning-fg', card: 'bg-warning-bg border-warning-fg/25', value: 'text-warning-fg', dot: 'bg-amber-400' },
  danger:  { badge: 'bg-danger-bg text-danger-fg',   card: 'bg-danger-bg border-danger-fg/25',   value: 'text-danger-fg',   dot: 'bg-red-500'  },
  neutral: { badge: 'bg-page text-ink-500',           card: 'border-border-soft bg-surface',      value: 'text-ink-400',     dot: 'bg-ink-300'  },
}

// ── summary card ──────────────────────────────────────────────────────────────

function SummaryCard({ icon: Icon, label, value, sub, className, valueClass }) {
  return (
    <div className={cn('rounded-[14px] border p-4 transition-colors', className)}>
      <div className="flex items-center gap-1.5 mb-2.5">
        <Icon className="w-3.5 h-3.5 text-ink-400" strokeWidth={1.75} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">{label}</span>
      </div>
      <p className={cn('font-bold leading-none tabular-nums', valueClass)}>{value}</p>
      {sub && <p className="text-xs text-ink-400 mt-1.5 leading-tight">{sub}</p>}
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export default function MonitoringEditPage({ row, onBack }) {
  const { t } = useLanguage()
  const isNew = !row?.id

  const [form, setForm] = useState({
    area:          row?.area           ?? '',
    projectId:     String(row?.project_id ?? ''),
    frequencyDays: String(row?.frequency_days ?? row?.frequencyDays ?? ''),
  })

  // project list for the picker
  const [projects, setProjects]   = useState([])
  // live data fetched from surveys for the selected project
  const [liveData, setLiveData]   = useState({ latestSurveyDate: null, surveyCount: 0 })
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)

  // load project list once
  useEffect(() => {
    supabase
      .from('projects')
      .select('id, code')
      .order('code', { ascending: true })
      .then(({ data }) => setProjects(data ?? []))
      .catch(console.error)
  }, [])

  // when project changes, fetch its real survey data for the preview
  useEffect(() => {
    if (!form.projectId) { setLiveData({ latestSurveyDate: null, surveyCount: 0 }); return }
    const pid = parseInt(form.projectId, 10)
    supabase
      .from('surveys')
      .select('id, date, created_at')
      .eq('project_id', pid)
      .then(({ data }) => {
        const list = data ?? []
        const sorted = [...list].sort(
          (a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at)
        )
        const latest = sorted[0]
        setLiveData({
          latestSurveyDate: latest ? (latest.date || latest.created_at) : null,
          surveyCount: list.length,
        })
      })
      .catch(console.error)
  }, [form.projectId])

  function handleProjectSelect(e) {
    const pid = e.target.value
    setForm(prev => ({ ...prev, projectId: pid }))
  }

  const selectedProject = projects.find(p => String(p.id) === form.projectId) ?? null

  const { nextDate, daysLeft } = useMemo(
    () => computeSchedule(liveData.latestSurveyDate, form.frequencyDays),
    [liveData.latestSurveyDate, form.frequencyDays],
  )

  const status = getStatus(daysLeft)
  const sc = STATUS_STYLE[status]
  const statusLabel = t(`monitoring.status${status.charAt(0).toUpperCase() + status.slice(1)}`)

  const daysDisplay =
    daysLeft === null ? '—'
    : daysLeft === 0  ? '0'
    : String(Math.abs(daysLeft))

  const daysSub =
    daysLeft === null ? t('monitoring.notScheduled')
    : daysLeft === 0  ? t('monitoring.dueToday')
    : daysLeft > 0    ? `${daysLeft} ${t('monitoring.daysLeft')}`
    :                   `${Math.abs(daysLeft)} ${t('monitoring.daysOverdue')}`

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.projectId) { setError('Selecione um projeto.'); return }
    setLoading(true)
    setError(null)
    const payload = {
      area:          form.area,
      projectId:     parseInt(form.projectId, 10),
      projectName:   selectedProject?.code ?? '',
      frequencyDays: parseInt(form.frequencyDays, 10),
    }
    try {
      if (isNew) {
        await createMonitoringRow(payload)
      } else {
        await updateMonitoringRow(row.id, payload)
      }
      onBack?.()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-5">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
          {t('monitoring.breadcrumb')}
        </button>
        <span className="text-ink-400 text-sm">/</span>
        <span className="text-sm font-semibold text-ink-900">
          {isNew ? t('monitoring.newBreadcrumb') : t('monitoring.editBreadcrumb')}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_272px] 3xl:grid-cols-[1fr_300px] 4xl:grid-cols-[1fr_340px] gap-5 3xl:gap-6 4xl:gap-8 items-start">

        {/* ── Left: form card ──────────────────────────────────────────── */}
        <Card>
          {/* Card header */}
          <div className="px-6 py-4 border-b border-border-soft flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs text-ink-400 leading-none mb-1 truncate">
                {form.area || t('monitoring.area')}
              </p>
              <h2 className="text-[17px] font-bold text-ink-900 leading-snug truncate">
                {selectedProject?.code || (row?.project_name) || t('monitoring.project')}
              </h2>
            </div>
            <span className={cn('shrink-0 inline-flex items-center gap-1.5 h-6 px-3 rounded-full text-[11px] font-semibold', sc.badge)}>
              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', sc.dot)} />
              {statusLabel}
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-6 pt-5 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">

              <FormField label={t('monitoring.area')}>
                <FormInput
                  value={form.area}
                  onChange={(e) => setForm(f => ({ ...f, area: e.target.value }))}
                  className="h-[44px]"
                />
              </FormField>

              {/* Project picker — sets project_id */}
              <FormField label={t('monitoring.project')}>
                <select
                  value={form.projectId}
                  onChange={handleProjectSelect}
                  required
                  className="w-full h-[44px] px-4 rounded-[10px] bg-input-bg border border-border-soft text-sm font-medium text-ink-900 outline-none focus:border-brand-300 focus:bg-surface transition-colors"
                >
                  <option value="">Selecione um projeto...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.code}</option>
                  ))}
                </select>
              </FormField>

              <FormField label={t('monitoring.frequency')}>
                <div className="relative">
                  <FormInput
                    type="number"
                    min="1"
                    value={form.frequencyDays}
                    onChange={(e) => setForm(f => ({ ...f, frequencyDays: e.target.value }))}
                    className="h-[44px] pr-14"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-400 pointer-events-none select-none">
                    {t('monitoring.daysSuffix')}
                  </span>
                </div>
              </FormField>

              {/* Computed: next inspection — read-only */}
              <FormField label={t('monitoring.nextInspection')}>
                <div className="h-[44px] px-4 rounded-[10px] border border-border-soft bg-page flex items-center justify-between gap-2">
                  <span className={cn('text-sm font-medium', nextDate ? 'text-ink-900' : 'text-ink-400')}>
                    {nextDate ? formatDateBR(nextDate) : '—'}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-ink-400 bg-border-soft rounded px-1.5 py-0.5 shrink-0 select-none">
                    AUTO
                  </span>
                </div>
              </FormField>

            </div>

            <div className="px-6 py-4 border-t border-border-soft flex items-center justify-end gap-3">
              {error && <p className="text-sm text-danger-fg mr-auto">{error}</p>}
              <button
                type="button"
                onClick={onBack}
                disabled={loading}
                className="h-9 px-5 rounded-full border border-border-soft text-sm font-medium text-ink-700 hover:bg-page transition-colors disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="h-9 px-5 rounded-full bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Salvando...' : t('common.save')}
              </button>
            </div>
          </form>
        </Card>

        {/* ── Right: live preview panel ─────────────────────────────────── */}
        <div className="flex flex-col gap-3">

          <SummaryCard
            icon={CalendarDays}
            label={t('monitoring.nextInspection')}
            value={nextDate ? formatDateBR(nextDate) : '—'}
            valueClass={nextDate ? 'text-xl text-ink-900' : 'text-xl text-ink-300'}
            sub={
              form.frequencyDays
                ? `${t('monitoring.frequency').split('(')[0].trim()}: ${form.frequencyDays} ${t('monitoring.daysSuffix')}`
                : t('monitoring.notScheduled')
            }
            className="border-border-soft bg-surface"
          />

          <SummaryCard
            icon={Clock}
            label={t('monitoring.remainingDays')}
            value={daysDisplay}
            valueClass={cn('text-[40px]', sc.value)}
            sub={daysSub}
            className={daysLeft !== null ? sc.card : 'border-border-soft bg-surface'}
          />

          <div className={cn('rounded-[14px] border p-4 transition-colors', sc.card)}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400 mb-3">Status</p>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', sc.dot)} />
              <span className={cn('text-[15px] font-bold leading-none', sc.value)}>{statusLabel}</span>
            </div>
            {form.frequencyDays && (
              <p className="text-xs text-ink-400">{t('monitoring.autoCalc')}</p>
            )}
          </div>

          <SummaryCard
            icon={ClipboardList}
            label={t('monitoring.surveyCount')}
            value={form.projectId ? String(liveData.surveyCount) : '—'}
            valueClass={liveData.surveyCount > 0 ? 'text-xl text-ink-900' : 'text-xl text-ink-300'}
            sub={
              liveData.latestSurveyDate
                ? `Último: ${new Date(liveData.latestSurveyDate).toLocaleDateString('pt-BR')}`
                : form.projectId ? 'Sem levantamentos registrados' : undefined
            }
            className="border-border-soft bg-surface"
          />

        </div>
      </div>
    </>
  )
}
