import { useState, useMemo } from 'react'
import {
  ArrowLeft, Save, Printer, Calendar,
  AlertTriangle, FileBarChart, Loader2,
} from 'lucide-react'
import AGALogo from './AGALogo'
import { getWeeklyReportFull, generateReport } from '../services/reportService'

// ── Date helpers ──────────────────────────────────────────────────────────────

function getMonday(d) {
  const date = new Date(d)
  const day  = date.getDay()
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1))
  return date
}

function fmtDate(d) {
  return d instanceof Date && !isNaN(d) ? d.toLocaleDateString('pt-BR') : '—'
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
      const start = new Date(); start.setDate(now.getDate() - 6); start.setHours(0, 0, 0, 0)
      return { start, end: new Date() }
    }
    case 'thisWeek': {
      const start = getMonday(new Date()); start.setHours(0, 0, 0, 0)
      return { start, end: new Date() }
    }
    case 'lastWeek': {
      const thisMonday = getMonday(new Date())
      const end   = new Date(thisMonday); end.setDate(end.getDate() - 1); end.setHours(23, 59, 59, 999)
      const start = new Date(thisMonday); start.setDate(start.getDate() - 7); start.setHours(0, 0, 0, 0)
      return { start, end }
    }
    case 'custom':
      return {
        start: customStart ? new Date(customStart + 'T00:00:00') : new Date(),
        end:   customEnd   ? new Date(customEnd   + 'T23:59:59') : new Date(),
      }
    default: {
      const start = new Date(); start.setDate(now.getDate() - 6); start.setHours(0, 0, 0, 0)
      return { start, end: new Date() }
    }
  }
}

function transformMonRow(r) {
  return {
    ...r,
    project:    r.projectName,
    surveys:    r.surveyCount,
    lastSurvey: r.lastSurvey ?? '—',
  }
}

function buildInsights(surveyCount, metrics, overdueRows, monitorRows) {
  const insights = []
  const deforms  = metrics.deformations   ?? 0
  const rehab    = metrics.rehabilitating ?? 0
  const errors   = metrics.errors         ?? 0
  const soon     = monitorRows.filter(r => r.daysUntilNext != null && r.daysUntilNext > 0 && r.daysUntilNext <= 3)
  const overdue  = overdueRows

  insights.push(surveyCount > 0
    ? `${surveyCount} novo${surveyCount !== 1 ? 's' : ''} levantamento${surveyCount !== 1 ? 's' : ''} cadastrado${surveyCount !== 1 ? 's' : ''} no período.`
    : 'Nenhum levantamento cadastrado no período selecionado.')

  insights.push(deforms > 0
    ? `${deforms} projeto${deforms !== 1 ? 's' : ''} com deformação ativa — requer atenção imediata.`
    : 'Nenhum projeto com deformação detectado no período.')

  insights.push(overdue.length > 0
    ? `${overdue.length} monitoramento${overdue.length !== 1 ? 's' : ''} com prazo vencido sem levantamento realizado.`
    : 'Todos os monitoramentos estão dentro do prazo estabelecido.')

  if (soon.length > 0)
    insights.push(`${soon.length} monitoramento${soon.length !== 1 ? 's' : ''} vence${soon.length !== 1 ? 'm' : ''} nos próximos 3 dias.`)
  if (rehab > 0)
    insights.push(`${rehab} projeto${rehab !== 1 ? 's' : ''} em processo ativo de reabilitação.`)
  if (errors > 0)
    insights.push(`${errors} projeto${errors !== 1 ? 's' : ''} com erro${errors !== 1 ? 's' : ''} de levantamento registrado${errors !== 1 ? 's' : ''}.`)

  return insights
}

// ── Document sub-components ───────────────────────────────────────────────────

function SectionHead({ num, title, count }) {
  return (
    <div className="flex items-baseline gap-3 mb-8 pb-3 border-b border-[#E4E4E4]">
      <span className="text-[11px] font-bold font-mono text-[#F97316] shrink-0 tabular-nums">
        {String(num).padStart(2, '0')}.
      </span>
      <h3 className="text-[11px] font-extrabold tracking-[0.15em] text-[#111111] uppercase shrink-0">
        {title}
      </h3>
      {count != null && (
        <span className="text-[11px] font-semibold text-[#999999]">({count})</span>
      )}
    </div>
  )
}

function BigStat({ value, label, accent }) {
  return (
    <div className="flex flex-col gap-2">
      <span className={`text-[3.5rem] font-black leading-none tabular-nums tracking-tight ${accent ? 'text-[#F97316]' : 'text-[#111111]'}`}>
        {value ?? 0}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#888888] leading-tight">
        {label}
      </span>
    </div>
  )
}

function DocTableHeader({ cols }) {
  return (
    <div className={`grid gap-4 px-5 py-3 bg-[#F5F5F5]`} style={{ gridTemplateColumns: cols.map(c => c.width ?? '1fr').join(' ') }}>
      {cols.map((col, i) => (
        <span key={i} className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#888888]">
          {col.label}
        </span>
      ))}
    </div>
  )
}

function ProjectBlock({ project }) {
  const images = project.images ?? []
  return (
    <div className="project-block py-7 border-b border-[#ECECEC] last:border-0">
      <div className="mb-4">
        <h4 className="text-2xl font-black text-[#111111] tracking-tight leading-tight">
          {project.code}
        </h4>
        <div className="w-10 h-[3px] bg-[#F97316] mt-2 rounded-sm" />
      </div>
      {project.fileName && (
        <p className="text-[11px] font-mono text-[#AAAAAA] mb-4">{project.fileName}</p>
      )}
      {images.length > 0 && (
        <div className={`grid gap-3 mb-5 ${images.length >= 2 ? 'grid-cols-2' : 'grid-cols-1 max-w-sm'}`}>
          {images.slice(0, 2).map((url, i) => (
            <div key={i} className="aspect-video overflow-hidden bg-[#F0F0F0]">
              <img
                src={url}
                alt={`${project.code} — imagem ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
      {project.notes && (
        <p className="text-sm text-[#555555] leading-relaxed border-l-2 border-[#E4E4E4] pl-4">
          {project.notes}
        </p>
      )}
    </div>
  )
}

function EmptyNote({ message }) {
  return <p className="text-sm text-[#BBBBBB] italic py-1">{message}</p>
}

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

// ── Main ──────────────────────────────────────────────────────────────────────

export default function WeeklyReportPage({ onBack, user }) {
  const [mode,         setMode]         = useState('last7')
  const [customStart,  setCustomStart]  = useState('')
  const [customEnd,    setCustomEnd]    = useState('')
  const [generated,    setGenerated]    = useState(false)
  const [generatedAt,  setGeneratedAt]  = useState(null)
  const [periodDates,  setPeriodDates]  = useState(null)
  const [observations, setObservations] = useState('')
  const [conclusion,   setConclusion]   = useState('')
  const [saved,        setSaved]        = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)
  const [reportData,   setReportData]   = useState(null)

  const PERIOD_TABS = [
    { key: 'last7',    label: 'Últimos 7 dias' },
    { key: 'thisWeek', label: 'Esta semana' },
    { key: 'lastWeek', label: 'Semana passada' },
    { key: 'custom',   label: 'Personalizado' },
  ]

  // ── Derived data ─────────────────────────────────────────────────────────────

  const surveyRows     = reportData?.surveys             ?? []
  const rehabRows      = reportData?.rehab               ?? []
  const deformProjects = reportData?.deformationProjects ?? []
  const errorProjects  = reportData?.errorProjects       ?? []
  const metrics        = reportData?.metrics             ?? { totalProjects: 0, deformations: 0, rehabilitating: 0, errors: 0 }
  const monitorRows    = (reportData?.monitoring ?? []).map(transformMonRow)

  const overdueRows = monitorRows.filter(r => r.daysUntilNext != null && r.daysUntilNext <= 0)
  const warnRows    = monitorRows.filter(r => r.daysUntilNext != null && r.daysUntilNext > 0 && r.daysUntilNext <= 3)

  const insights = useMemo(
    () => buildInsights(surveyRows.length, metrics, overdueRows, monitorRows),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [surveyRows.length, metrics.deformations, metrics.rehabilitating, metrics.errors, overdueRows.length, monitorRows.length],
  )

  // ── Actions ───────────────────────────────────────────────────────────────────

  async function handleGenerate() {
    const dates = getPeriodDates(mode, customStart, customEnd)
    setPeriodDates(dates)
    setGeneratedAt(new Date())
    setLoading(true)
    setError(null)
    setGenerated(false)
    setReportData(null)
    try {
      const data = await getWeeklyReportFull(dates.start, dates.end)
      setReportData(data)
      setGenerated(true)
      setTimeout(() => document.getElementById('vm-report')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    } catch (err) {
      setError(err.message || 'Erro ao gerar relatório. Verifique a conexão com o servidor.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!periodDates) return
    const payload = {
      periodStart:    periodDates.start.toISOString(),
      periodEnd:      periodDates.end.toISOString(),
      observations,
      conclusion,
      newSurveys:     surveyRows.length,
      deformations:   metrics.deformations   ?? 0,
      rehabilitation: metrics.rehabilitating ?? 0,
      errors:         metrics.errors         ?? 0,
    }
    try {
      await generateReport(payload)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <>
      {generated && (
        <style>{`
          @media print {
            @page { margin: 1.8cm 2cm; size: A4 portrait; }
            .project-block { break-inside: avoid; }
            .report-section { break-inside: avoid; }
            .cover-page { break-after: page; }
          }
        `}</style>
      )}

      {/* ── Controls (screen only) ─────────────────────────────────────────── */}
      <div className="print:hidden">

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

        <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
          <div className="flex flex-wrap gap-2">
            {PERIOD_TABS.map(tab => (
              <PeriodTab
                key={tab.key}
                label={tab.label}
                active={mode === tab.key}
                onClick={() => { setMode(tab.key); setGenerated(false); setError(null) }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {saved && <span className="text-xs text-success-fg font-semibold">✓ Salvo</span>}
            <button
              type="button"
              disabled={!generated || loading}
              onClick={handleSave}
              className="h-9 px-4 flex items-center gap-1.5 rounded-full border border-border-soft bg-surface text-sm font-medium text-ink-700 hover:bg-page transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save className="w-3.5 h-3.5" strokeWidth={2} />
              Salvar
            </button>
            <button
              type="button"
              disabled={!generated || loading}
              onClick={() => window.print()}
              className="h-9 px-4 flex items-center gap-1.5 rounded-full border border-border-soft bg-surface text-sm font-medium text-ink-700 hover:bg-page transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Printer className="w-3.5 h-3.5" strokeWidth={2} />
              Exportar PDF
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleGenerate}
              className="h-9 px-5 flex items-center gap-1.5 rounded-full bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 active:bg-brand-700 transition-colors disabled:opacity-60"
            >
              {loading
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} /> Gerando...</>
                : <><FileBarChart className="w-3.5 h-3.5" strokeWidth={2} /> Gerar Relatório</>
              }
            </button>
          </div>
        </div>

        {mode === 'custom' && (
          <div className="flex items-center gap-2 mt-3 mb-1">
            <Calendar className="w-3.5 h-3.5 text-ink-400 shrink-0" strokeWidth={2} />
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="h-8 px-2.5 text-xs rounded-lg border border-border-soft bg-surface text-ink-900 focus:outline-none focus:border-brand-400 transition-colors"
            />
            <span className="text-xs text-ink-400">até</span>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className="h-8 px-2.5 text-xs rounded-lg border border-border-soft bg-surface text-ink-900 focus:outline-none focus:border-brand-400 transition-colors"
            />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-6 rounded-2xl border border-border-soft bg-surface flex flex-col items-center justify-center py-28 gap-4">
            <Loader2 className="w-10 h-10 text-brand-500 animate-spin" strokeWidth={1.5} />
            <p className="text-sm font-medium text-ink-500">Buscando dados do período...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="mt-6 rounded-2xl border border-danger-bg bg-danger-bg/40 flex flex-col items-center justify-center py-16 gap-3 px-8">
            <AlertTriangle className="w-8 h-8 text-danger-fg" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-danger-fg text-center">{error}</p>
            <button
              type="button"
              onClick={handleGenerate}
              className="mt-1 h-9 px-5 rounded-full bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Empty prompt */}
        {!loading && !error && !generated && (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-border bg-surface flex flex-col items-center justify-center py-28 gap-5">
            <div className="w-20 h-20 rounded-2xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center">
              <FileBarChart className="w-9 h-9 text-[#F97316]" strokeWidth={1.5} />
            </div>
            <div className="text-center max-w-sm">
              <p className="text-base font-bold text-ink-900">Nenhum relatório gerado</p>
              <p className="text-sm text-ink-500 mt-2 leading-relaxed">
                Selecione o período acima e clique em{' '}
                <strong className="text-ink-700">Gerar Relatório</strong> para criar a pré-visualização.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              className="mt-1 h-10 px-6 flex items-center gap-2 rounded-full bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors"
            >
              <FileBarChart className="w-4 h-4" strokeWidth={2} />
              Gerar Relatório
            </button>
          </div>
        )}
      </div>

      {/* ── Report Document ───────────────────────────────────────────────────── */}
      {generated && periodDates && reportData && (
        <div
          id="vm-report"
          className="mt-6 print:mt-0 bg-white rounded-2xl overflow-hidden shadow-sm border border-[#E4E4E4] print:shadow-none print:border-0 print:rounded-none"
          style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
        >

          {/* ── COVER ─────────────────────────────────────────────────────────── */}
          <div className="cover-page px-10 pt-10 pb-14 border-b-2 border-[#EBEBEB]">

            {/* Top row: logo + generation meta */}
            <div className="flex items-start justify-between gap-6 mb-10">
              <AGALogo size="lg" variant="light" />
              <div className="text-right">
                <p className="text-[11px] text-[#BBBBBB] font-medium tracking-wide">Gerado em</p>
                <p className="text-[12px] font-semibold text-[#666666]">{fmtDatetime(generatedAt)}</p>
                {user?.name && (
                  <p className="text-[11px] text-[#AAAAAA] mt-0.5">por {user.name}</p>
                )}
              </div>
            </div>

            {/* Orange accent rule */}
            <div className="h-[3px] bg-[#F97316] w-full mb-10 rounded-sm" />

            {/* Main title block */}
            <div className="mb-10">
              <p className="text-[11px] font-bold tracking-[0.22em] text-[#F97316] uppercase mb-4">
                Relatório Operacional Semanal
              </p>
              <h1 className="text-[2.75rem] font-black text-[#0A0A0A] tracking-tight leading-[1.06] mb-5">
                Relatório Semanal<br />AngloGold Ashanti
              </h1>
              <p className="text-base text-[#666666] leading-relaxed max-w-2xl">
                Número de projetos analisados, adicionados e identificação de possíveis
                deformações e erros no período.
              </p>
            </div>

            {/* Period line */}
            <div className="flex items-center gap-3">
              <div className="w-6 h-px bg-[#CCCCCC]" />
              <span className="text-sm text-[#777777] font-medium">Período de análise:</span>
              <span className="text-sm font-black text-[#111111] tracking-wide">
                {fmtDate(periodDates.start)} — {fmtDate(periodDates.end)}
              </span>
            </div>
          </div>

          {/* ── BODY ──────────────────────────────────────────────────────────── */}
          <div className="px-10 py-10 flex flex-col gap-14 bg-white">

            {/* 01. RESUMO EXECUTIVO ────────────────────────────────────────── */}
            <section className="report-section">
              <SectionHead num={1} title="Resumo Executivo" />

              {/* Big numbers grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 pb-10 mb-8 border-b border-[#ECECEC]">
                <BigStat value={surveyRows.length}          label="Novos Levantamentos" accent />
                <BigStat value={metrics.deformations  ?? 0} label="Com Deformação" />
                <BigStat value={metrics.rehabilitating ?? 0} label="Em Reabilitação" />
                <BigStat value={metrics.errors         ?? 0} label="Com Erros" />
              </div>

              {/* Operational summary as clean bullets */}
              <div className="flex flex-col gap-2.5">
                {insights.map((text, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="mt-[8px] w-1.5 h-1.5 rounded-full bg-[#CCCCCC] shrink-0" />
                    <p className="text-sm text-[#444444] leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 02. NOVOS LEVANTAMENTOS ────────────────────────────────────── */}
            <section className="report-section">
              <SectionHead num={2} title="Novos Levantamentos" count={surveyRows.length || undefined} />

              {surveyRows.length === 0 ? (
                <EmptyNote message="Nenhum levantamento cadastrado no período selecionado." />
              ) : (
                <div className="border border-[#E4E4E4] overflow-hidden">
                  <DocTableHeader cols={[
                    { label: 'Local / Código', width: '2fr' },
                    { label: 'Arquivo',        width: '3fr' },
                    { label: 'Levant.',        width: '1fr' },
                    { label: 'Data',           width: '1.5fr' },
                    { label: 'Metragem',       width: '1fr' },
                  ]} />
                  <div className="divide-y divide-[#EFEFEF]">
                    {surveyRows.map((row, i) => (
                      <div
                        key={row.id ?? i}
                        className="grid gap-4 px-5 py-3.5 bg-white"
                        style={{ gridTemplateColumns: '2fr 3fr 1fr 1.5fr 1fr' }}
                      >
                        <span className="text-sm font-bold text-[#111111] truncate">{row.local}</span>
                        <span className="text-[11px] font-mono text-[#777777] truncate" title={row.file}>{row.file}</span>
                        <span className="text-sm text-[#666666] tabular-nums">{row.surveys}</span>
                        <span className="text-sm text-[#666666]">{row.date}</span>
                        <span className="text-sm text-[#666666]">{row.metering ?? '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* 03. PROJETOS COM DEFORMAÇÃO ────────────────────────────────── */}
            <section className="report-section">
              <SectionHead num={3} title="Projetos com Deformação" count={deformProjects.length || undefined} />

              {deformProjects.length === 0 ? (
                <EmptyNote message="Nenhum projeto com deformação ativa no período." />
              ) : (
                <div className="border-t border-[#ECECEC]">
                  {deformProjects.map((p, i) => (
                    <ProjectBlock key={p.id ?? i} project={p} />
                  ))}
                </div>
              )}
            </section>

            {/* 04. PROJETOS COM ERRO ──────────────────────────────────────── */}
            <section className="report-section">
              <SectionHead num={4} title="Projetos com Erro" count={errorProjects.length || undefined} />

              {errorProjects.length === 0 ? (
                <EmptyNote message="Nenhum projeto com erro de levantamento no período." />
              ) : (
                <div className="border-t border-[#ECECEC]">
                  {errorProjects.map((p, i) => (
                    <ProjectBlock key={p.id ?? i} project={p} />
                  ))}
                </div>
              )}
            </section>

            {/* 05. REABILITAÇÃO ───────────────────────────────────────────── */}
            <section className="report-section">
              <SectionHead num={5} title="Projetos em Reabilitação" count={rehabRows.length || undefined} />

              {rehabRows.length === 0 ? (
                <EmptyNote message="Nenhum projeto em reabilitação no momento." />
              ) : (
                <div className="border border-[#E4E4E4] overflow-hidden">
                  <DocTableHeader cols={[
                    { label: 'Código do Projeto', width: '2fr' },
                    { label: 'Última Atualização', width: '2fr' },
                    { label: 'Situação', width: '2fr' },
                  ]} />
                  <div className="divide-y divide-[#EFEFEF]">
                    {rehabRows.map((p, i) => (
                      <div
                        key={p.id ?? i}
                        className="grid gap-4 px-5 py-3.5 bg-white"
                        style={{ gridTemplateColumns: '2fr 2fr 2fr' }}
                      >
                        <span className="text-sm font-bold text-[#111111]">{p.code}</span>
                        <span className="text-sm text-[#666666]">{p.date}</span>
                        <span className="text-sm text-[#444444] font-medium">Em Reabilitação</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* 06. ALERTAS DE MONITORAMENTO ───────────────────────────────── */}
            <section className="report-section">
              <SectionHead
                num={6}
                title="Alertas de Monitoramento"
                count={(overdueRows.length + warnRows.length) || undefined}
              />

              {overdueRows.length === 0 && warnRows.length === 0 ? (
                <EmptyNote message={
                  monitorRows.length === 0
                    ? 'Nenhum monitoramento cadastrado.'
                    : 'Todos os monitoramentos estão dentro do prazo.'
                } />
              ) : (
                <div className="flex flex-col gap-8">

                  {overdueRows.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#111111] mb-4">
                        Levantamentos Vencidos — {overdueRows.length}
                      </p>
                      <div className="border border-[#E4E4E4] overflow-hidden">
                        <DocTableHeader cols={[
                          { label: 'Área',          width: '2fr' },
                          { label: 'Projeto',       width: '2fr' },
                          { label: 'Frequência',    width: '1fr' },
                          { label: 'Último Levant.', width: '2fr' },
                          { label: 'Atraso',        width: '1fr' },
                        ]} />
                        <div className="divide-y divide-[#EFEFEF]">
                          {overdueRows.map((row, i) => (
                            <div
                              key={i}
                              className="grid gap-4 px-5 py-3.5 bg-white items-center"
                              style={{ gridTemplateColumns: '2fr 2fr 1fr 2fr 1fr' }}
                            >
                              <span className="text-sm font-bold text-[#111111]">{row.area}</span>
                              <span className="text-sm text-[#444444]">{row.project}</span>
                              <span className="text-sm text-[#666666]">{row.frequencyDays}d</span>
                              <span className="text-sm text-[#666666]">{row.lastSurvey}</span>
                              <span className="text-[11px] font-black text-[#111111] tabular-nums">
                                +{Math.abs(row.daysUntilNext)}d
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {warnRows.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#111111] mb-4">
                        Vencimento Próximo — {warnRows.length}
                      </p>
                      <div className="border border-[#E4E4E4] overflow-hidden">
                        <DocTableHeader cols={[
                          { label: 'Área',    width: '2fr' },
                          { label: 'Projeto', width: '3fr' },
                          { label: 'Prazo',   width: '1fr' },
                        ]} />
                        <div className="divide-y divide-[#EFEFEF]">
                          {warnRows.map((row, i) => (
                            <div
                              key={i}
                              className="grid gap-4 px-5 py-3.5 bg-white"
                              style={{ gridTemplateColumns: '2fr 3fr 1fr' }}
                            >
                              <span className="text-sm font-bold text-[#111111]">{row.area}</span>
                              <span className="text-sm text-[#444444]">{row.project}</span>
                              <span className="text-sm font-semibold text-[#444444] tabular-nums">{row.daysUntilNext}d</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* 07. OBSERVAÇÕES ────────────────────────────────────────────── */}
            <section className="report-section">
              <SectionHead num={7} title="Observações" />
              <div className="relative">
                <textarea
                  value={observations}
                  onChange={e => setObservations(e.target.value)}
                  placeholder="Registre ocorrências relevantes, mudanças de procedimento, pontos de atenção identificados no período..."
                  rows={5}
                  className="w-full p-5 text-sm text-[#333333] border border-[#E4E4E4] resize-none focus:outline-none focus:border-[#F97316]/50 leading-relaxed placeholder:text-[#CCCCCC] print:bg-transparent transition-colors"
                  style={{ fontFamily: 'inherit' }}
                />
                {observations && (
                  <div className="absolute bottom-3 right-3 text-[10px] text-[#CCCCCC] print:hidden">
                    {observations.length} car.
                  </div>
                )}
              </div>
            </section>

            {/* 08. CONCLUSÃO ──────────────────────────────────────────────── */}
            <section className="report-section">
              <SectionHead num={8} title="Conclusão" />
              <textarea
                value={conclusion}
                onChange={e => setConclusion(e.target.value)}
                placeholder="Síntese das atividades do período, resultados alcançados e recomendações para o próximo ciclo de monitoramento..."
                rows={4}
                className="w-full p-5 text-sm text-[#333333] border border-[#E4E4E4] resize-none focus:outline-none focus:border-[#F97316]/50 leading-relaxed placeholder:text-[#CCCCCC] print:bg-transparent transition-colors"
                style={{ fontFamily: 'inherit' }}
              />
            </section>

            {/* ── FOOTER ──────────────────────────────────────────────────── */}
            <div className="pt-8 border-t-2 border-[#E4E4E4] flex items-end justify-between gap-6 flex-wrap">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#AAAAAA] mb-2">
                  Elaborado por
                </p>
                <p className="text-sm font-black text-[#111111]">{user?.name ?? '—'}</p>
                {user?.role && (
                  <p className="text-xs text-[#666666] mt-0.5">{user.role}</p>
                )}
                <div className="mt-8 w-52 border-b border-[#CCCCCC]" />
                <p className="text-[10px] text-[#AAAAAA] mt-1.5 tracking-wide">
                  Assinatura / Visto
                </p>
              </div>

              <div className="text-right flex flex-col items-end gap-2">
                <AGALogo size="sm" variant="light" />
                <p className="text-[10px] text-[#AAAAAA]">Sistema de Gestão de Levantamentos</p>
                <p className="text-[10px] text-[#AAAAAA]">{fmtDatetime(generatedAt)}</p>
                <div className="h-[3px] w-12 bg-[#F97316] rounded-sm mt-2" />
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
