import { useState, useEffect } from 'react'
import { ArrowLeft, Pencil, FileText, Image, Clock } from 'lucide-react'
import Card from './Card'
import MetaCard from './MetaCard'
import StatusBadge from './StatusBadge'
import ImageCarousel from './ImageCarousel'
import { cn } from '../lib/cn'
import { getProjectById, getProjectSurveys } from '../services/projectService'
import { useLanguage } from '../contexts/LanguageContext'

export default function ProjectDetailsPage({ project, onBack, onEdit }) {
  const { t } = useLanguage()
  const [detail, setDetail]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [surveys, setSurveys] = useState([])

  useEffect(() => {
    if (!project?.id) { setLoading(false); return }
    setLoading(true)
    Promise.all([
      getProjectById(project.id),
      getProjectSurveys(project.id).catch(() => []),
    ]).then(([proj, srvs]) => {
      setDetail(proj)
      setSurveys(srvs)
    }).catch(() => setDetail(null))
      .finally(() => setLoading(false))
  }, [project?.id])

  const d = detail ?? project
  const code = d?.code ?? '—'
  const statuses = d?.statuses?.length ? d.statuses : [{ variant: 'success' }]
  const surveyCount = Array.isArray(d?.surveys)
    ? (d?.surveyCount ?? d?.surveys.length)
    : Number(d?.surveys ?? d?.surveyCount ?? d?.survey_count ?? 0)
  const rehabStatus = d?.rehabilitationStatus
  const images = (d?.images ?? [])
    .map(img => img.url ?? img.src ?? img.path ?? img.imageUrl)
    .filter(Boolean)
  const projectUrl = d?.projectUrl || d?.projectLink || d?.link || d?.url || null

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-ink-400">
        Carregando...
      </div>
    )
  }

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
          {t('detail.back')}
        </button>
        <span className="text-ink-400 text-sm">/</span>
        <span className="text-sm font-semibold text-ink-900">{code}</span>
      </div>

      <Card>
        <div className="p-4 sm:p-5 flex flex-col gap-3">

          {/* ── Header: code + statuses + rehab pill + edit button ── */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center flex-wrap gap-2 min-w-0">
              <span className="text-lg font-semibold text-ink-900 truncate">{code}</span>
              {statuses.map((s, i) => (
                <StatusBadge key={i} variant={s.variant}>{t('status.' + s.variant)}</StatusBadge>
              ))}
              {rehabStatus && (
                <span className={cn(
                  'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border',
                  rehabStatus === 'rehabilitated'
                    ? 'bg-[#EEF2FF] border-[#6366F1]/20 text-[#4F46E5]'
                    : 'bg-warning-bg border-warning-fg/20 text-warning-fg',
                )}>
                  <span className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    rehabStatus === 'rehabilitated' ? 'bg-[#6366F1]' : 'bg-warning-fg',
                  )} />
                  {rehabStatus === 'rehabilitated' ? 'Reabilitado' : 'Em Reabilitação'}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onEdit?.(d)}
              className="shrink-0 h-8 px-3 flex items-center gap-1.5 rounded-full bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors"
            >
              <Pencil className="w-3 h-3" strokeWidth={2} />
              {t('detail.editProject')}
            </button>
          </div>

          {/* ── Two-column body ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

            {/* Left column: info + actions + history */}
            <div className="flex flex-col gap-3">

              {/* Filename — compact single row */}
              <div className="flex items-center gap-2 bg-page border border-border-soft rounded-lg px-3 py-2 min-w-0">
                <FileText className="w-3.5 h-3.5 text-ink-400 shrink-0" strokeWidth={1.75} />
                <span className="text-[11px] font-medium text-ink-500 shrink-0">{t('detail.fileName')}</span>
                <span className="text-[11px] font-mono text-ink-700 truncate" title={d?.fileName ?? ''}>
                  {d?.fileName ?? '—'}
                </span>
              </div>

              {/* 3 meta cards in a row */}
              <div className="grid grid-cols-3 gap-2">
                <MetaCard label={t('detail.lastSurvey')}   value={d?.date ?? '—'} />
                <MetaCard label={t('detail.surveysCount')} value={String(surveyCount)} />
                <MetaCard label={t('detail.totalArea')}    value={d?.metragem ? `${d.metragem} m` : '—'} />
              </div>

              {/* Notes */}
              {d?.notes && (
                <div className="bg-page border border-border-soft rounded-lg px-3 py-2.5">
                  <p className="text-xs text-ink-500 leading-relaxed">{d.notes}</p>
                </div>
              )}

              {/* Action buttons — always side by side */}
              <div className="grid grid-cols-2 gap-2">
                {projectUrl ? (
                  <button
                    type="button"
                    onClick={() => window.open(projectUrl, '_blank', 'noopener,noreferrer')}
                    className="h-9 flex items-center justify-center rounded-full bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors"
                  >
                    {t('detail.projectLink')}
                  </button>
                ) : (
                  <div className="h-9 flex items-center justify-center rounded-full bg-surface border border-border-soft text-xs font-medium text-ink-400 select-none cursor-not-allowed">
                    {t('detail.noProjectLink')}
                  </div>
                )}
                <button
                  type="button"
                  className="h-9 flex items-center justify-center rounded-full border border-border-soft text-xs font-medium text-ink-700 hover:bg-page transition-colors"
                >
                  {t('detail.detonationAreas')}
                </button>
              </div>

              {/* Survey history — compact with scroll cap */}
              {surveys.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-3.5 h-3.5 text-ink-400 shrink-0" strokeWidth={1.75} />
                    <span className="text-xs font-semibold text-ink-700">Histórico de Levantamentos</span>
                    <span className="text-[10px] font-bold text-brand-500 bg-brand-500/10 px-1.5 py-0.5 rounded-full">
                      {surveys.length}
                    </span>
                  </div>
                  <div className="flex flex-col divide-y divide-border-soft rounded-lg border border-border-soft overflow-hidden max-h-[220px] overflow-y-auto">
                    {surveys.map((s, i) => (
                      <div key={s.id ?? i} className="flex items-center gap-3 px-3 py-2 bg-page text-xs">
                        <span className="font-mono text-ink-400 shrink-0 w-5 text-right">{i + 1}</span>
                        <span className="font-medium text-ink-700 truncate flex-1" title={s.file}>
                          {s.file || '—'}
                        </span>
                        <span className="text-ink-400 shrink-0">
                          {s.createdAt
                            ? new Date(s.createdAt).toLocaleDateString('pt-BR')
                            : s.date
                              ? new Date(s.date).toLocaleDateString('pt-BR')
                              : '—'}
                        </span>
                        {s.metering && (
                          <span className="text-ink-400 shrink-0">{s.metering} m</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Right column: image gallery */}
            <div>
              {images.length > 0 ? (
                <ImageCarousel images={images} />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-ink-400 bg-page border border-border-soft rounded-lg">
                  <Image className="w-8 h-8 opacity-40" strokeWidth={1.5} />
                  <span className="text-sm">{t('detail.noImages')}</span>
                </div>
              )}
            </div>

          </div>

        </div>
      </Card>
    </>
  )
}
