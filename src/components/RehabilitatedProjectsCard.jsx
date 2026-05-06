import Card from './Card'
import CardHeader from './CardHeader'
import CardMenuButton from './CardMenuButton'
import LinkAction from './LinkAction'
import { REHABILITATED_PROJECTS } from '../data/dashboard'
import { useLanguage } from '../contexts/LanguageContext'

function ProjectRow({ project, isLast, viewLabel }) {
  return (
    <div
      className={`flex items-center px-6 h-[59.5px] ${
        isLast ? '' : 'border-b border-border-soft'
      }`}
    >
      <div className="w-[210px] shrink-0 text-sm font-medium text-ink-900">
        {project.code}
      </div>
      <div className="w-[141px] shrink-0 text-sm text-ink-500">
        {project.date}
      </div>
      <div className="flex-1 text-right">
        <LinkAction>{viewLabel}</LinkAction>
      </div>
    </div>
  )
}

export default function RehabilitatedProjectsCard() {
  const { t } = useLanguage()
  return (
    <Card className="h-[307px]">
      <CardHeader
        title={t('rehab.title')}
        action={<CardMenuButton />}
        divider={true}
      />
      <div className="flex-1 min-h-0">
        {REHABILITATED_PROJECTS.map((p, i) => (
          <ProjectRow
            key={p.id}
            project={p}
            isLast={i === REHABILITATED_PROJECTS.length - 1}
            viewLabel={t('rehab.viewProject')}
          />
        ))}
      </div>
    </Card>
  )
}
