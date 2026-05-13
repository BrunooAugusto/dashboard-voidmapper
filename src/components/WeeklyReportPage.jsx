import { useState, useEffect } from 'react'
import {
  ArrowLeft, Save, Calendar, Printer,
  AlertTriangle, CheckCircle, Newspaper,
} from 'lucide-react'
import {
  MONITORING_ROWS,
  REHABILITATED_PROJECTS,
  RECENT_SURVEYS,
  REPORT_DATA,
} from '../data/dashboard'
import { getMetrics, getRecentSurveys, getRehabilitatedProjects } from '../services/surveyService'
import { getMonitoringRows } from '../services/monitoringService'
import { generateReport, getWeeklyReportFull } from '../services/reportService'
import StatusBadge from './StatusBadge'
import { useLanguage } from '../contexts/LanguageContext'

// ── Date helpers ──────────────────────────────────────────────────────────────

function getMonday(d) {
  const date = new Date(d)
  const day  = date.getDay()
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1))
  return date
}

function fmtDate(d) {
  return d instanceof Date && !isNaN(d)
    ? d.toLocaleDateString('pt-BR')
    : '—'
}

function fmtDatetime(d) {
  return d instanceof Date && !isNaN(d)
    ? d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    : '—'
}

function getPeriodDates(mode, customStart, customEnd) {
  const now = new Date()
  switch (mode) {
    case 'last7': {
      const start = new Date()
      start.setDate(now.getDate() - 6)
      start.setHours(0, 0, 0, 0)
      return { start, end: new Date() }
    }
    case 'thisWeek': {
      const start = getMonday(new Date())
      start.setHours(0, 0, 0, 0)
      return { start, end: new Date() }
    }
    case 'lastWeek': {
      const thisMonday = getMonday(new Date())
      const end        = new Date(thisMonday)
      end.setDate(end.getDate() - 1)
      end.setHours(23, 59, 59, 999)
      const start = new Date(thisMonday)
      start.setDate(start.getDate() - 7)
      start.setHours(0, 0, 0, 0)
      return { start, end }
    }
    case 'custom':
      return {
        start: customStart ? new Date(customStart + 'T00:00:00') : new Date(),
        end:   customEnd   ? new Date(customEnd   + 'T23:59:59') : new Date(),
      }
    default: {
      const start = new Date()
      start.setDate(now.getDate() - 6)
      start.setHours(0, 0, 0, 0)
      return { start, end: new Date() }
    }
  }
}

// ── Small UI helpers ──────────────────────────────────────────────────────────

function PeriodTab({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 px-4 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
        active
          ? 'bg-brand-500 text-white'
          : 'bg-surface border border-border-soft text-ink-700 hover:bg-page'
      }`}
    >
      {label}
    </button>
  )
}

function SectionHead({ num, title }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="text-[10px] font-bold tracking-[0.18em] text-[#F97316] font-mono shrink-0">
        {String(num).padStart(2, '0')}.
      </span>
      <h3 className="text-xs font-bold tracking-[0.10em] text-[#0F172A] uppercase whitespace-nowrap">{title}</h3>
      <div className="flex-1 h-px bg-[#E7E7E8]" />
    </div>
  )
}

function StatCard({ label, value, accent }) {
  return (
    <div className={`flex-1 min-w-[110px] rounded-xl p-4 flex flex-col gap-3 border ${
      accent
        ? 'border-[#F97316]/30 bg-[#FFF7ED]'
        : 'border-[#E7E7E8] bg-white'
    }`}>
      <span className="text-[11px] font-medium text-[#64748B] leading-tight">{label}</span>
      <span className={`text-4xl font-bold leading-none ${accent ? 'text-[#F97316]' : 'text-[#0F172A]'}`}>
        {value}
      </span>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WeeklyReportPage({ onBack, user }) {
  const { t } = useLanguage()

  // Period state
  const [mode, setMode]               = useState('last7')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd]     = useState('')

  // Report state
  const [generated, setGenerated]     = useState(false)
  const [generatedAt, setGeneratedAt] = useState(null)
  const [periodDates, setPeriodDates] = useState(null)
  const [observations, setObservations] = useState('')
  const [conclusion, setConclusion]   = useState('')
  const [saved, setSaved]             = useState(false)

  // Live data (falls back to mock data if API unavailable)
  const [liveData, setLiveData]       = useState(null)

  const PERIOD_TABS = [
    { key: 'last7',    label: 'Últimos 7 dias' },
    { key: 'thisWeek', label: 'Esta semana' },
    { key: 'lastWeek', label: 'Semana passada' },
    { key: 'custom',   label: 'Personalizado' },
  ]

  // Fetch live data on mount — silently falls back to mocks on failure
  useEffect(() => {
    Promise.all([
      getMetrics().catch(() => null),
      getRecentSurveys().catch(() => null),
      getRehabilitatedProjects().catch(() => null),
      getMonitoringRows().catch(() => null),
      getWeeklyReportFull().catch(() => null),
    ]).then(([metrics, surveys, rehab, monitoring, weeklyFull]) => {
      setLiveData({
        metrics,
        surveys,
        rehab,
        monitoring,
        deformationProjects: weeklyFull?.deformationProjects ?? null,
      })
    })
  }, [])

  // Derive display data — live API data takes priority, mocks are fallback
  const weekStats = liveData?.metrics ? [
    { label: 'Novos Levantamentos', value: liveData.metrics.totalSurveys ?? REPORT_DATA.weekStats[0].value },
    { label: 'Deformação',          value: liveData.metrics.deformations  ?? REPORT_DATA.weekStats[1].value },
    { label: 'Reabilitação',        value: liveData.metrics.rehabilitating ?? REPORT_DATA.weekStats[2].value },
    { label: 'Erros',               value: liveData.metrics.errors         ?? REPORT_DATA.weekStats[3].value },
  ] : REPORT_DATA.weekStats

  const surveyRows        = (liveData?.surveys    && liveData.surveys.length    > 0) ? liveData.surveys    : RECENT_SURVEYS
  const rehabRows         = (liveData?.rehab      && liveData.rehab.length      > 0) ? liveData.rehab      : REHABILITATED_PROJECTS
  const monitorRows       = (liveData?.monitoring && liveData.monitoring.length > 0) ? liveData.monitoring : MONITORING_ROWS
  const overdueRows       = monitorRows.filter((r) => r.daysUntilNext <= 0)
  const deformProjects    = liveData?.deformationProjects ?? null

  function handleGenerate() {
    const dates = getPeriodDates(mode, customStart, customEnd)
    setPeriodDates(dates)
    setGeneratedAt(new Date())
    setGenerated(true)
    setSaved(false)
    setTimeout(() => {
      document.getElementById('vm-report')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  function handleExportPDF() {
    window.print()
  }

  async function handleSave() {
    const payload = {
      periodStart:   periodDates?.start?.toISOString(),
      periodEnd:     periodDates?.end?.toISOString(),
      observations,
      conclusion,
      newSurveys:    liveData?.metrics?.totalSurveys    ?? 0,
      deformations:  liveData?.metrics?.deformations    ?? 0,
      rehabilitation: liveData?.metrics?.rehabilitating ?? 0,
      errors:        liveData?.metrics?.errors          ?? 0,
    }
    await generateReport(payload)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <>
      {/* ── Controls — hidden when printing ──────────────────────────────── */}
      <div className="print:hidden">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-5">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
            Dashboard
          </button>
          <span className="text-ink-400 text-sm">/</span>
          <span className="text-sm font-semibold text-ink-900">Relatório Semanal</span>
        </div>

        {/* Period tabs + action buttons */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-2">

          {/* Left: period tabs */}
          <div className="flex flex-wrap gap-2">
            {PERIOD_TABS.map((tab) => (
              <PeriodTab
                key={tab.key}
                label={tab.label}
                active={mode === tab.key}
                onClick={() => { setMode(tab.key); setGenerated(false) }}
              />
            ))}
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {saved && (
              <span className="text-xs text-success-fg font-semibold">✓ Salvo com sucesso</span>
            )}
            <button
              type="button"
              disabled={!generated}
              onClick={handleSave}
              className="h-9 px-4 flex items-center gap-1.5 rounded-full border border-border-soft bg-surface text-sm font-medium text-ink-700 hover:bg-page transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save className="w-3.5 h-3.5" strokeWidth={2} />
              Salvar Relatório
            </button>
            <button
              type="button"
              disabled={!generated}
              onClick={handleExportPDF}
              className="h-9 px-4 flex items-center gap-1.5 rounded-full border border-border-soft bg-surface text-sm font-medium text-ink-700 hover:bg-page transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Printer className="w-3.5 h-3.5" strokeWidth={2} />
              Exportar PDF
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              className="h-9 px-5 flex items-center gap-1.5 rounded-full bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 active:bg-brand-700 transition-colors"
            >
              <Newspaper className="w-3.5 h-3.5" strokeWidth={2} />
              Gerar Relatório
            </button>
          </div>
        </div>

        {/* Custom date range — only shown in custom mode */}
        {mode === 'custom' && (
          <div className="flex items-center gap-2 mt-3 mb-1">
            <Calendar className="w-3.5 h-3.5 text-ink-400 shrink-0" strokeWidth={2} />
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="h-8 px-2.5 text-xs rounded-lg border border-border-soft bg-surface text-ink-900 focus:outline-none focus:border-brand-400 transition-colors"
            />
            <span className="text-xs text-ink-400">até</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="h-8 px-2.5 text-xs rounded-lg border border-border-soft bg-surface text-ink-900 focus:outline-none focus:border-brand-400 transition-colors"
            />
          </div>
        )}

        {/* Empty state */}
        {!generated && (
          <div className="mt-6 rounded-xl border border-dashed border-border bg-surface flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center">
              <Newspaper className="w-8 h-8 text-brand-500" strokeWidth={1.5} />
            </div>
            <div className="text-center max-w-xs">
              <p className="text-sm font-semibold text-ink-900">Nenhum relatório gerado</p>
              <p className="text-xs text-ink-500 mt-1.5 leading-relaxed">
                Selecione o período desejado e clique em{' '}
                <strong className="text-ink-700">Gerar Relatório</strong> para criar a pré-visualização.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* ── Report document ───────────────────────────────────────────────── */}
      {/* Visible on screen after generation; fills the page when printing   */}
      {generated && periodDates && (
        <div
          id="vm-report"
          className="mt-6 print:mt-0 report-root bg-white rounded-xl overflow-hidden border border-border-soft print:border-0 print:rounded-none"
        >

          {/* ── Header band ──────────────────────────────────────────────── */}
          <div className="bg-[#0F172A] px-8 pt-8 pb-7">
            <div className="flex items-start justify-between gap-6">

              {/* Brand */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-[#F97316] rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-white text-xl font-black leading-none select-none">V</span>
                </div>
                <div>
                  <div className="text-white text-xl font-bold tracking-tight">
                    Void <span className="text-[#F97316]">Mapper</span>
                  </div>
                  <div className="text-[#94A3B8] text-[11px] mt-0.5 font-medium">
                    Sistema de Gestão de Levantamentos
                  </div>
                </div>
              </div>

              {/* Report meta */}
              <div className="text-right">
                <div className="text-[#F97316] text-[10px] font-bold tracking-[0.18em] uppercase">
                  Relatório Semanal
                </div>
                <div className="text-white text-base font-semibold mt-1.5">
                  {fmtDate(periodDates.start)} – {fmtDate(periodDates.end)}
                </div>
                <div className="text-[#94A3B8] text-xs mt-1">
                  Gerado em {fmtDatetime(generatedAt)}
                </div>
              </div>
            </div>

            <div className="mt-6 h-px bg-[#F97316]/25" />
          </div>

          {/* ── Body ─────────────────────────────────────────────────────── */}
          <div className="p-8 flex flex-col gap-12">

            {/* 01. Resumo Executivo */}
            <section className="report-section">
              <SectionHead num={1} title="Resumo Executivo" />
              <div className="flex flex-wrap gap-3">
                {weekStats.map((s, i) => (
                  <StatCard
                    key={s.label}
                    label={s.label}
                    value={s.value}
                    accent={i === 0}
                  />
                ))}
              </div>
            </section>

            {/* 02. Novos Levantamentos */}
            <section className="report-section">
              <SectionHead num={2} title="Novos Levantamentos" />
              <div className="rounded-xl border border-[#E7E7E8] overflow-hidden">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F6F6F7] border-b border-[#E7E7E8]">
                      {['Local', 'Arquivo', 'Status', 'Data', 'Nº Levant.', 'Metragem'].map((h, i) => (
                        <th
                          key={h}
                          className={`px-3 py-2.5 font-semibold text-[#334155] whitespace-nowrap ${
                            i === 4 ? 'text-center' : i === 5 ? 'text-right' : 'text-left'
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {surveyRows.map((row, i) => (
                      <tr
                        key={row.id ?? i}
                        className={`border-b border-[#E7E7E8] last:border-0 ${i % 2 !== 0 ? 'bg-[#F6F6F7]/50' : 'bg-white'}`}
                      >
                        <td className="px-3 py-2.5 font-medium text-[#0F172A]">{row.local}</td>
                        <td className="px-3 py-2.5 font-mono text-[10px] text-[#334155] max-w-[200px]">
                          <span className="block truncate" title={row.file}>{row.file}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusBadge variant={row.status.variant}>
                            {t('status.' + row.status.variant)}
                          </StatusBadge>
                        </td>
                        <td className="px-3 py-2.5 text-[#64748B] whitespace-nowrap">{row.date}</td>
                        <td className="px-3 py-2.5 text-center text-[#64748B]">{row.surveys}</td>
                        <td className="px-3 py-2.5 text-right text-[#64748B]">{row.metering}</td>
                      </tr>
                    ))}
                    {surveyRows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-[#94A3B8] text-xs">
                          Nenhum levantamento no período selecionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 03. Imagens dos Projetos com Deformação */}
            {deformProjects && deformProjects.some(p => p.mainImage) && (
              <section className="report-section">
                <SectionHead num={3} title="Imagens dos Levantamentos" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {deformProjects.filter(p => p.mainImage).map((p, i) => (
                    <div key={i} className="flex flex-col gap-1.5 report-image-card">
                      <div className="aspect-[627/340] rounded-lg overflow-hidden bg-zinc-900">
                        <img src={p.mainImage} alt={p.code} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      <span className="text-[10px] text-[#64748B] font-mono leading-tight truncate">{p.code}</span>
                      <div className="h-[2px] w-16 bg-[#F97316] rounded-full" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 04. Projetos com Deformação */}
            <section className="report-section">
              <SectionHead num={4} title="Projetos com Deformação" />
              {deformProjects && deformProjects.length > 0 ? (
                <div className="rounded-xl border border-[#E7E7E8] overflow-hidden">
                  <div className="bg-[#FEE2E2] px-4 py-2.5 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#B91C1C] shrink-0" strokeWidth={2} />
                    <span className="text-sm font-semibold text-[#B91C1C]">
                      {deformProjects.length} projeto{deformProjects.length !== 1 ? 's' : ''} com deformação
                    </span>
                  </div>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#F6F6F7] border-b border-[#E7E7E8]">
                        <th className="text-left px-4 py-2.5 font-semibold text-[#334155]">Código</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-[#334155]">Arquivo</th>
                        <th className="text-center px-4 py-2.5 font-semibold text-[#334155]">Levant.</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-[#334155]">Data</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-[#334155]">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deformProjects.map((p, i) => (
                        <tr key={p.id ?? i} className={`border-b border-[#E7E7E8] last:border-0 ${i % 2 !== 0 ? 'bg-[#F6F6F7]/50' : 'bg-white'}`}>
                          <td className="px-4 py-2.5 font-semibold text-[#0F172A]">{p.code}</td>
                          <td className="px-4 py-2.5 font-mono text-[10px] text-[#334155] max-w-[180px]">
                            <span className="block truncate" title={p.fileName}>{p.fileName ?? '—'}</span>
                          </td>
                          <td className="px-4 py-2.5 text-center text-[#64748B]">{p.surveys}</td>
                          <td className="px-4 py-2.5 text-[#64748B] whitespace-nowrap">{p.date}</td>
                          <td className="px-4 py-2.5">
                            <StatusBadge variant="danger">{t('status.danger')}</StatusBadge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {deformProjects.some(p => p.notes) && (
                    <div className="p-4 border-t border-[#E7E7E8]">
                      {deformProjects.filter(p => p.notes).map((p, i) => (
                        <div key={i} className="mb-3 last:mb-0">
                          <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wide mb-1">{p.code} — Observações</div>
                          <p className="text-xs text-[#64748B] leading-relaxed">{p.notes}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-[#DCFCE7] border border-[#DCFCE7]">
                  <CheckCircle className="w-4 h-4 text-[#15803D] shrink-0" strokeWidth={2} />
                  <span className="text-sm text-[#15803D] font-medium">Nenhum projeto com deformação no período.</span>
                </div>
              )}
            </section>

            {/* 05. Projetos Reabilitados */}
            <section className="report-section">
              <SectionHead num={5} title="Projetos Reabilitados" />
              {rehabRows.length > 0 ? (
                <div className="rounded-xl border border-[#E7E7E8] overflow-hidden">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#F6F6F7] border-b border-[#E7E7E8]">
                        <th className="text-left px-4 py-2.5 font-semibold text-[#334155]">Código do Projeto</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-[#334155]">Data</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-[#334155]">Situação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rehabRows.map((p, i) => (
                        <tr
                          key={p.id ?? i}
                          className={`border-b border-[#E7E7E8] last:border-0 ${i % 2 !== 0 ? 'bg-[#F6F6F7]/50' : 'bg-white'}`}
                        >
                          <td className="px-4 py-2.5 font-semibold text-[#0F172A]">{p.code}</td>
                          <td className="px-4 py-2.5 text-[#64748B]">{p.date}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5 text-[#15803D]" strokeWidth={2} />
                              <span className="text-[#15803D] font-medium">Reabilitado</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-[#64748B] italic">Nenhum projeto reabilitado no período.</p>
              )}
            </section>

            {/* 06. Alertas de Monitoramento */}
            <section className="report-section">
              <SectionHead num={6} title="Alertas de Monitoramento" />
              {overdueRows.length > 0 ? (
                <div className="rounded-xl border border-[#FEE2E2] overflow-hidden">
                  <div className="bg-[#FEE2E2] px-4 py-2.5 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#B91C1C] shrink-0" strokeWidth={2} />
                    <span className="text-xs font-semibold text-[#B91C1C]">
                      {overdueRows.length} levantamento{overdueRows.length !== 1 ? 's' : ''} vencido{overdueRows.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#F6F6F7] border-b border-[#E7E7E8]">
                        <th className="text-left px-4 py-2.5 font-semibold text-[#334155]">Área</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-[#334155]">Projeto</th>
                        <th className="text-center px-4 py-2.5 font-semibold text-[#334155]">Frequência</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-[#334155]">Último Levant.</th>
                        <th className="text-center px-4 py-2.5 font-semibold text-[#334155]">Atraso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overdueRows.map((row, i) => (
                        <tr key={i} className="border-b border-[#E7E7E8] last:border-0 bg-white">
                          <td className="px-4 py-2.5 font-semibold text-[#0F172A]">{row.area}</td>
                          <td className="px-4 py-2.5 text-[#334155]">{row.project}</td>
                          <td className="px-4 py-2.5 text-center text-[#64748B]">{row.frequencyDays}d</td>
                          <td className="px-4 py-2.5 text-[#64748B]">{row.lastSurvey}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-[#FEE2E2] text-[#B91C1C] font-bold text-[11px]">
                              +{Math.abs(row.daysUntilNext)}d
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#DCFCE7] border border-[#DCFCE7]">
                  <CheckCircle className="w-4 h-4 text-[#15803D] shrink-0" strokeWidth={2} />
                  <span className="text-sm text-[#15803D] font-medium">
                    Todos os monitoramentos estão em dia.
                  </span>
                </div>
              )}
            </section>

            {/* 07. Observações */}
            <section className="report-section">
              <SectionHead num={7} title="Observações" />
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Digite aqui as observações da semana..."
                rows={5}
                className="w-full p-4 text-sm text-[#334155] border border-[#E7E7E8] rounded-xl resize-none focus:outline-none focus:border-[#F97316] bg-[#F6F6F7] leading-relaxed placeholder:text-[#94A3B8] print:border-[#E7E7E8] print:bg-transparent print:resize-none transition-colors"
                style={{ fontFamily: 'inherit' }}
              />
            </section>

            {/* 08. Conclusão */}
            <section className="report-section">
              <SectionHead num={8} title="Conclusão" />
              <textarea
                value={conclusion}
                onChange={(e) => setConclusion(e.target.value)}
                placeholder="Digite aqui a conclusão do período..."
                rows={4}
                className="w-full p-4 text-sm text-[#334155] border border-[#E7E7E8] rounded-xl resize-none focus:outline-none focus:border-[#F97316] bg-[#F6F6F7] leading-relaxed placeholder:text-[#94A3B8] print:border-[#E7E7E8] print:bg-transparent print:resize-none transition-colors"
                style={{ fontFamily: 'inherit' }}
              />
            </section>

            {/* ── Footer / Signature ─────────────────────────────────────── */}
            <div className="pt-6 mt-2 border-t border-[#E7E7E8] flex items-end justify-between gap-6">
              {/* Left: Responsible */}
              <div>
                <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wide mb-1">
                  Elaborado por
                </div>
                <div className="text-sm font-bold text-[#0F172A]">
                  {user?.name ?? 'Void Mapper'}
                </div>
                {user?.role && (
                  <div className="text-xs text-[#64748B] mt-0.5">{user.role}</div>
                )}
                <div className="mt-4 w-40 border-b border-[#94A3B8]" />
                <div className="text-[10px] text-[#94A3B8] mt-1">Assinatura</div>
              </div>

              {/* Right: System info */}
              <div className="text-right">
                <div className="flex items-center gap-1.5 justify-end mb-1">
                  <div className="w-5 h-5 bg-[#F97316] rounded-md flex items-center justify-center shrink-0">
                    <span className="text-white text-[10px] font-black">V</span>
                  </div>
                  <span className="text-sm font-bold text-[#0F172A]">
                    Void <span className="text-[#F97316]">Mapper</span>
                  </span>
                </div>
                <div className="text-[10px] text-[#64748B]">
                  Sistema de Gestão de Levantamentos
                </div>
                <div className="text-[10px] text-[#94A3B8] mt-0.5">
                  {fmtDatetime(generatedAt)}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
