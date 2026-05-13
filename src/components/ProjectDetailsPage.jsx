import { useState, useEffect } from 'react'
import { ArrowLeft, Pencil, FileText, Image, Clock } from 'lucide-react'
import Card from './Card'
import MetaCard from './MetaCard'
import StatusBadge from './StatusBadge'
import ImageCarousel from './ImageCarousel'
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
        <div className="p-4 sm:p-5 flex flex-col gap-4">

          {/* 1 — Project header: code + status + edit button */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center flex-wrap gap-2 min-w-0">
              <span className="text-lg font-semibold text-ink-900 truncate">{code}</span>
              {statuses.map((s, i) => (
                <StatusBadge key={i} variant={s.variant}>{t('status.' + s.variant)}</StatusBadge>
              ))}
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

          {/* 2 — File name + meta stats */}
          <div className="bg-page border border-border-soft rounded-lg p-3 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-ink-400 shrink-0" strokeWidth={1.75} />
                <span className="text-xs font-medium text-ink-500">{t('detail.fileName')}</span>
              </div>
              <p className="text-[11px] font-mono text-ink-700 break-all leading-relaxed pl-5">
                {d?.fileName ?? '—'}
              </p>
            </div>

            <div className="h-px bg-border-soft" />

            <div className="grid grid-cols-3 3xl:grid-cols-4 gap-2 3xl:gap-3">
              <MetaCard label={t('detail.lastSurvey')}   value={d?.date ?? '—'} />
              <MetaCard label={t('detail.surveysCount')} value={String(surveyCount)} />
              <MetaCard label={t('detail.totalArea')}    value={d?.metragem ? `${d.metragem} m` : '—'} />
            </div>
          </div>

          {/* 3 — Rehabilitation status (only when project has warning status) */}
          {rehabStatus && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning-bg border border-warning-fg/20">
              <span className="w-2 h-2 rounded-full bg-warning-fg shrink-0" />
              <span className="text-xs font-semibold text-warning-fg">
                {rehabStatus === 'rehabilitated' ? 'Reabilitado' : 'Em Reabilitação'}
              </span>
            </div>
          )}

          {/* 4 — Observations */}
          {d?.notes && (
            <div className="bg-page border border-border-soft rounded-lg p-3 flex flex-col gap-2">
              <span className="text-sm font-semibold text-ink-900">{t('detail.notes')}</span>
              <p className="text-xs text-ink-500 leading-relaxed">{d.notes}</p>
            </div>
          )}

          {/* 4 — Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {projectUrl ? (
              <button
                type="button"
                onClick={() => window.open(projectUrl, '_blank', 'noopener,noreferrer')}
                className="h-10 flex items-center justify-center rounded-full bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors"
              >
                {t('detail.projectLink')}
              </button>
            ) : (
              <div className="h-10 flex items-center justify-center rounded-full bg-surface border border-border-soft text-sm font-medium text-ink-400 select-none cursor-not-allowed">
                {t('detail.noProjectLink')}
              </div>
            )}
            <button
              type="button"
              className="h-10 flex items-center justify-center rounded-full border border-border-soft text-sm font-medium text-ink-700 hover:bg-page transition-colors"
            >
              {t('detail.detonationAreas')}
            </button>
          </div>

          {/* 5 — Survey history */}
          {surveys.length > 0 && (
            <div className="border-t border-border-soft pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-3.5 h-3.5 text-ink-400 shrink-0" strokeWidth={1.75} />
                <span className="text-xs font-semibold text-ink-700">Histórico de Levantamentos</span>
                <span className="text-[10px] font-bold text-brand-500 bg-brand-500/10 px-1.5 py-0.5 rounded-full">{surveys.length}</span>
              </div>
              <div className="flex flex-col divide-y divide-border-soft rounded-lg border border-border-soft overflow-hidden">
                {surveys.map((s, i) => (
                  <div key={s.id ?? i} className="flex items-center gap-3 px-3 py-2.5 bg-page text-xs">
                    <span className="font-mono text-ink-400 shrink-0 w-5 text-right">{i + 1}</span>
                    <span className="font-medium text-ink-700 truncate flex-1" title={s.file}>{s.file || '—'}</span>
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

          {/* 6 — Image gallery (always visible) */}
          <div className="border-t border-border-soft pt-4">
            {images.length > 0 ? (
              <ImageCarousel images={images} />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-ink-400">
                <Image className="w-8 h-8 opacity-40" strokeWidth={1.5} />
                <span className="text-sm">{t('detail.noImages')}</span>
              </div>
            )}
          </div>

        </div>
      </Card>
    </>
  )
}
