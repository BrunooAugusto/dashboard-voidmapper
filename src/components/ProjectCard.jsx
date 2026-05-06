import StatusBadge from './StatusBadge'
import { useLanguage } from '../contexts/LanguageContext'

export default function ProjectCard({ project, onClick }) {
  const { t } = useLanguage()
  const label = project.surveys === 1 ? t('projects.survey') : t('projects.surveys')

  return (
    <div onClick={onClick} className="border border-border-soft rounded-[10px] p-4 flex flex-col gap-[10px] bg-surface hover:shadow-sm hover:border-border transition-all cursor-pointer">
      <div className="flex flex-wrap gap-[10px]">
        {project.statuses.map((s, i) => (
          <StatusBadge key={i} variant={s.variant} size="md">
            {t('status.' + s.variant)}
          </StatusBadge>
        ))}
      </div>
      <div className="flex flex-col gap-[6px]">
        <p className="text-[22px] font-medium text-ink-900 leading-[1.4]">{project.code}</p>
        <p className="text-sm text-ink-500 leading-[1.4]">{project.date}</p>
        <p className="text-sm text-ink-500 leading-[1.4]">
          {project.surveys} {label}
        </p>
      </div>
    </div>
  )
}
