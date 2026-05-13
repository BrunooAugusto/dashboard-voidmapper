import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../lib/cn'
import Card from './Card'
import ProjectCard from './ProjectCard'
import SearchInput from './SearchInput'
import { getProjects, deleteProject } from '../services/projectService'
import { useLanguage } from '../contexts/LanguageContext'

const LEVELS = Array.from({ length: 19 }, (_, i) => i + 6) // 6..24

export default function ProjectsPage({ onSelectProject, onNavigate }) {
  const { t } = useLanguage()
  const [search,       setSearch]       = useState('')
  const [activeFilter, setActiveFilter] = useState(null)
  const [activeLevel,  setActiveLevel]  = useState('')   // '' = all
  const [projects,     setProjects]     = useState([])

  useEffect(() => {
    getProjects().then(setProjects).catch(console.error)
  }, [])

  const FILTER_CHIPS = [
    { key: 'danger',  label: t('projects.filterDeformations')   },
    { key: 'warning', label: t('projects.filterRehabilitating') },
    { key: 'info',    label: t('projects.filterErrors')         },
  ]

  const filtered = projects.filter((p) => {
    const q        = search.trim().toLowerCase()
    const statuses = Array.isArray(p.statuses) ? p.statuses : []

    const matchesSearch = !q
      || p.code.toLowerCase().includes(q)
      || (p.fileName ?? '').toLowerCase().includes(q)
      || (p.level != null && String(p.level).includes(q))
      || statuses.some(s => (s.variant ?? '').toLowerCase().includes(q))

    const matchesStatus = !activeFilter || statuses.some(s => s.variant === activeFilter)

    const matchesLevel  = activeLevel === '' || (p.level != null && p.level === parseInt(activeLevel, 10))

    return matchesSearch && matchesStatus && matchesLevel
  })

  function toggleFilter(key) {
    setActiveFilter((prev) => (prev === key ? null : key))
  }

  async function handleDelete(id) {
    await deleteProject(id)
    setProjects(prev => prev.filter(p => p.id !== id))
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
        {/* Level dropdown */}
        <div className="relative inline-flex items-center">
          <select
            value={activeLevel}
            onChange={e => setActiveLevel(e.target.value)}
            className={cn(
              'h-[26px] appearance-none pl-3 pr-7 rounded-md border text-[12px] font-medium transition-colors cursor-pointer outline-none',
              activeLevel !== ''
                ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                : 'border-border-soft bg-surface text-ink-700 hover:bg-page',
            )}
          >
            <option value="">Todos os níveis</option>
            {LEVELS.map(l => (
              <option key={l} value={l}>Nível {l}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-ink-500" strokeWidth={2} />
        </div>

        {/* Status filter chips */}
        {FILTER_CHIPS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => toggleFilter(f.key)}
            className={cn(
              'h-[26px] inline-flex items-center px-3 rounded-md border text-[12px] font-medium transition-colors',
              activeFilter === f.key
                ? 'border-brand-500 bg-brand-500/10 text-brand-500'
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
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 4xl:grid-cols-4 5xl:grid-cols-5 gap-4 3xl:gap-5 4xl:gap-6">
            {filtered.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onClick={() => onSelectProject?.(p)}
                onDelete={handleDelete}
              />
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
