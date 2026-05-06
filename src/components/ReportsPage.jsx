import { ArrowLeft, FileText, Calendar, BarChart2 } from 'lucide-react'
import Card from './Card'
import { REPORT_DATA } from '../data/dashboard'
import { useLanguage } from '../contexts/LanguageContext'

function StatTile({ label, value }) {
  return (
    <div className="flex-1 min-w-0 border border-border-soft rounded-lg overflow-hidden p-3 flex flex-col gap-5">
      <span className="text-xs font-medium text-ink-500 whitespace-nowrap">{label}</span>
      <span className="text-5xl font-semibold text-ink-900 leading-none">{value}</span>
    </div>
  )
}

function ScanCard({ src, filename }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="aspect-[627/340] rounded-lg overflow-hidden bg-zinc-900">
        <img src={src} alt={filename} className="w-full h-full object-cover" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-ink-900">{filename}</span>
        <div className="h-[2px] w-36 bg-brand-500 mt-1" />
      </div>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <h2 className="text-[22px] font-semibold text-ink-900 leading-snug">{children}</h2>
  )
}

export default function ReportsPage({ onBack }) {
  const { t } = useLanguage()
  const d = REPORT_DATA

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
          {t('reports.back')}
        </button>
        <span className="text-ink-400 text-sm">/</span>
        <span className="text-sm font-semibold text-ink-900">{t('reports.breadcrumb')}</span>
      </div>

      <Card>
        <div className="p-4 flex flex-col gap-14">

          {/* Section 1: Added this week */}
          <div className="flex flex-col gap-5">
            <SectionTitle>{t('reports.thisWeek')}</SectionTitle>
            <div className="flex gap-2.5">
              {d.weekStats.map((s) => (
                <StatTile key={s.label} label={s.label} value={s.value} />
              ))}
            </div>
          </div>

          {/* Section 2: New surveys */}
          <div className="flex flex-col gap-5">
            <SectionTitle>{t('reports.newSurveys')}</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {d.newSurveys.map((s, i) => (
                <ScanCard key={i} src={s.src} filename={s.filename} />
              ))}
            </div>
          </div>

          {/* Section 3: New projects */}
          <div className="flex flex-col gap-5">
            <SectionTitle>{t('reports.newProjects')}</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {d.newProjects.map((s, i) => (
                <ScanCard key={i} src={s.src} filename={s.filename} />
              ))}
            </div>
          </div>

          {/* Section 4: Deformation projects */}
          <div className="flex flex-col gap-6">
            <SectionTitle>{t('reports.deformation')}</SectionTitle>
            <div className="flex flex-col lg:flex-row gap-3 items-start">

              {/* Left: scan images */}
              <div className="flex-1 min-w-0 flex flex-col gap-3">
                <div className="rounded-xl overflow-hidden bg-zinc-900 h-[383px]">
                  <img
                    src={d.deformation.mainImage}
                    alt="Scan principal"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 h-[121px]">
                  {d.deformation.thumbnails.map((src, i) => (
                    <div key={i} className="rounded-xl overflow-hidden bg-zinc-900 h-full">
                      <img
                        src={src}
                        alt={`Levantamento ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: project info panel */}
              <div className="lg:w-[400px] shrink-0 border border-border-soft rounded-xl p-3 flex flex-col gap-3">

                <h3 className="text-[22px] font-semibold text-ink-900 leading-tight">
                  {d.deformation.code}
                </h3>

                {/* File name card */}
                <div className="bg-page border border-border-soft rounded-[7px] p-3 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-ink-400 shrink-0" strokeWidth={1.75} />
                    <span className="text-xs font-medium text-ink-500">{t('reports.fileName')}</span>
                  </div>
                  <p className="text-[11px] font-mono text-ink-700 break-all leading-relaxed pl-5">
                    {d.deformation.file}
                  </p>
                </div>

                {/* Date + Surveys row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-page border border-border-soft rounded-[7px] p-3 flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-ink-400 shrink-0" strokeWidth={1.75} />
                      <span className="text-xs font-medium text-ink-500">{t('reports.date')}</span>
                    </div>
                    <span className="text-[10px] text-ink-400 pl-5">{t('reports.lastSurvey')}</span>
                    <span className="text-sm font-semibold text-ink-900 pl-5 mt-1">
                      {d.deformation.lastSurvey}
                    </span>
                  </div>
                  <div className="bg-page border border-border-soft rounded-[7px] p-3 flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <BarChart2 className="w-3.5 h-3.5 text-ink-400 shrink-0" strokeWidth={1.75} />
                      <span className="text-xs font-medium text-ink-500">{t('reports.surveys')}</span>
                    </div>
                    <span className="text-sm font-semibold text-ink-900 pl-5 mt-auto pt-3">
                      {d.deformation.surveys}
                    </span>
                  </div>
                </div>

                {/* Notes card */}
                <div className="bg-page border border-border-soft rounded-[7px] p-3 flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-ink-900">{t('reports.notes')}</span>
                  <p className="text-xs text-ink-500 leading-relaxed">{d.deformation.notes}</p>
                </div>

                {/* View deformation button */}
                <div className="flex justify-center pt-1">
                  <a
                    href={d.deformation.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-10 py-2.5 bg-brand-500 text-white text-sm font-medium rounded-[7px] hover:bg-brand-600 transition-colors"
                  >
                    {t('reports.viewDeformation')}
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>
      </Card>
    </>
  )
}
