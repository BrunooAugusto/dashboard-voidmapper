import { ArrowLeft, Pencil, FileText, Ruler } from 'lucide-react'
import Card from './Card'
import MetaCard from './MetaCard'
import StatusBadge from './StatusBadge'
import { PROJECT_DETAIL } from '../data/dashboard'
import { useLanguage } from '../contexts/LanguageContext'

function ScanImage({ src, alt, className }) {
  return (
    <div className={`rounded-xl overflow-hidden bg-zinc-900 ${className}`}>
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    </div>
  )
}

export default function ProjectDetailsPage({ project, onBack, onEdit }) {
  const { t } = useLanguage()
  const code = project?.code ?? PROJECT_DETAIL.code
  const primaryStatus = project?.statuses?.[0] ?? PROJECT_DETAIL.status
  const surveys = project?.surveys ?? PROJECT_DETAIL.surveys

  const d = PROJECT_DETAIL

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
        <StatusBadge variant={primaryStatus.variant}>{t('status.' + primaryStatus.variant)}</StatusBadge>
      </div>

      {/* Top card: scan images + info panel */}
      <Card>
        <div className="p-4 flex flex-col lg:flex-row gap-4">

          {/* Left: scan images */}
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            <ScanImage src={d.mainImage} alt="Scan principal" className="h-[320px]" />
            <div className="grid grid-cols-3 gap-3">
              {d.thumbnails.map((src, i) => (
                <ScanImage key={i} src={src} alt={`Levantamento ${i + 1}`} className="h-[100px]" />
              ))}
            </div>
          </div>

          {/* Right: info panel */}
          <div className="lg:w-[390px] shrink-0 flex flex-col gap-3">

            {/* Project header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base font-semibold text-ink-900 truncate">{code}</span>
                <StatusBadge variant={primaryStatus.variant}>{t('status.' + primaryStatus.variant)}</StatusBadge>
              </div>
              <button
                type="button"
                onClick={() => onEdit?.(project)}
                className="shrink-0 h-8 px-3 flex items-center gap-1.5 rounded-full bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors"
              >
                <Pencil className="w-3 h-3" strokeWidth={2} />
                {t('detail.editProject')}
              </button>
            </div>

            {/* File information card */}
            <div className="bg-page border border-border-soft rounded-lg p-3 flex flex-col gap-3">

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-ink-400 shrink-0" strokeWidth={1.75} />
                  <span className="text-xs font-medium text-ink-500">{t('detail.fileName')}</span>
                </div>
                <p className="text-[11px] font-mono text-ink-700 break-all leading-relaxed pl-5">
                  {d.file}
                </p>
              </div>

              <div className="h-px bg-border-soft" />

              <div className="grid grid-cols-3 gap-2">
                <MetaCard label={t('detail.lastSurvey')} value={d.lastSurvey} />
                <MetaCard label={t('detail.surveysCount')} value={String(surveys)} />
                <MetaCard label={t('detail.totalArea')} value={`${d.metragem} m`} />
              </div>
            </div>

            {/* Notes card */}
            <div className="bg-page border border-border-soft rounded-lg p-3 flex-1 flex flex-col gap-2">
              <span className="text-sm font-semibold text-ink-900">
                {t('detail.notes')}
              </span>
              <p className="text-xs text-ink-500 leading-relaxed">{d.notes}</p>
            </div>

            {/* Action buttons */}
            <a
              href={d.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 flex items-center justify-center rounded-full bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors"
            >
              {t('detail.projectLink')}
            </a>
            <button
              type="button"
              className="h-10 flex items-center justify-center rounded-full border border-border-soft text-sm font-medium text-ink-700 hover:bg-page transition-colors"
            >
              {t('detail.detonationAreas')}
            </button>
          </div>
        </div>
      </Card>

      {/* Bottom: map + metragem */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_390px] gap-4">
        <div className="rounded-xl overflow-hidden bg-zinc-900 min-h-[260px]">
          <img
            src={d.mapImage}
            alt={t('detail.mapTitle')}
            className="w-full h-full object-cover"
          />
        </div>

        <Card>
          <div className="p-6 flex flex-col h-full min-h-[260px]">
            <div className="flex items-center gap-2 mb-1">
              <Ruler className="w-4 h-4 text-ink-400" strokeWidth={1.75} />
              <p className="text-sm font-semibold text-ink-900">{t('detail.areaTitle')}</p>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <span className="text-8xl font-bold text-ink-900 leading-none tracking-tight">
                {d.metragem}
              </span>
              <span className="text-4xl font-bold text-ink-500 ml-2 leading-none self-end pb-2">
                m
              </span>
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}
