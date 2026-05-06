import { useState } from 'react'
import { cn } from '../lib/cn'
import Card from './Card'
import FilterButton from './FilterButton'
import ProjectCard from './ProjectCard'
import SearchInput from './SearchInput'
import { PROJECTS } from '../data/dashboard'
import { useLanguage } from '../contexts/LanguageContext'

export default function ProjectsPage({ onSelectProject, onNavigate }) {
  const { t } = useLanguage()
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState(null)

  const FILTER_CHIPS = [
    { key: 'danger',  label: t('projects.filterDeformations')   },
    { key: 'warning', label: t('projects.filterRehabilitating') },
    { key: 'info',    label: t('projects.filterErrors')         },
  ]

  const filtered = PROJECTS.filter((p) => {
    const matchesSearch = p.code.toLowerCase().includes(search.toLowerCase())
    const matchesFilter =
      !activeFilter || p.statuses.some((s) => s.variant === activeFilter)
    return matchesSearch && matchesFilter
  })

  function toggleFilter(key) {
    setActiveFilter((prev) => (prev === key ? null : key))
  }

  return (
    <>
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
        <h2 className="text-[28px] font-semibold text-ink-900 leading-tight">
          {t('projects.title')}
        </h2>
        <div className="flex items-center gap-3">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            onClick={() => onNavigate?.('novo-projeto')}
            className="h-10 px-5 bg-brand-500 text-white text-sm font-semibold rounded-full whitespace-nowrap hover:bg-brand-600 transition-colors"
          >
            {t('projects.newProject')}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <FilterButton label={t('projects.filterBy')} />
        {FILTER_CHIPS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => toggleFilter(f.key)}
            className={cn(
              'h-[26px] inline-flex items-center px-3 rounded-md border text-[12px] font-medium transition-colors',
              activeFilter === f.key
                ? 'border-brand-500 bg-brand-50 text-brand-600'
                : 'border-border-soft bg-surface text-ink-700 hover:bg-page',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Projects grid */}
      <Card>
        {filtered.length > 0 ? (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <ProjectCard key={p.id} project={p} onClick={() => onSelectProject?.(p)} />
            ))}
          </div>
        ) : (
          <div className="p-12 flex items-center justify-center text-ink-400 text-sm">
            {t('projects.noResults')}
          </div>
        )}
      </Card>
    </>
  )
}
