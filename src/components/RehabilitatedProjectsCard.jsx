import { useState, useEffect } from 'react'
import Card from './Card'
import CardHeader from './CardHeader'
import CardMenuButton from './CardMenuButton'
import LinkAction from './LinkAction'
import { cn } from '../lib/cn'
import { getRehabilitatedProjects } from '../services/surveyService'
import { useLanguage } from '../contexts/LanguageContext'

function ProjectRow({ project, isLast, viewLabel, onView }) {
  return (
    <div
      className={cn(
        'flex items-center px-6 h-[60px] gap-4',
        !isLast && 'border-b border-border-soft',
      )}
    >
      <div className="flex-1 min-w-0 text-sm font-medium text-ink-900 truncate">
        {project.code}
      </div>
      <div className="shrink-0 text-sm text-ink-500 pr-2">
        {project.date}
      </div>
      <div className="shrink-0">
        <LinkAction onClick={() => onView?.(project)}>{viewLabel}</LinkAction>
      </div>
    </div>
  )
}

export default function RehabilitatedProjectsCard({ onSelectProject }) {
  const { t } = useLanguage()
  const [projects, setProjects] = useState([])

  useEffect(() => {
    getRehabilitatedProjects().then(setProjects).catch(console.error)
  }, [])

  return (
    <Card className="h-full">
      <CardHeader
        title={t('rehab.title')}
        action={<CardMenuButton />}
        divider={true}
      />
      <div className="flex-1 min-h-0">
        {projects.length === 0 ? (
          <div className="flex items-center justify-center h-full py-10 text-sm text-ink-400">
            {t('rehab.empty')}
          </div>
        ) : projects.map((p, i) => (
          <ProjectRow
            key={p.id}
            project={p}
            isLast={i === projects.length - 1}
            viewLabel={t('rehab.viewProject')}
            onView={onSelectProject}
          />
        ))}
      </div>
    </Card>
  )
}
