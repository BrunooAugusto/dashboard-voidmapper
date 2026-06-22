import { useState, useEffect, useMemo } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../lib/cn'
import Card from './Card'
import ProjectCard from './ProjectCard'
import ConfirmModal from './ConfirmModal'
import SearchInput from './SearchInput'
import { getProjects, deleteProjectCascade } from '../services/projectService'
import { usePermissions } from '../hooks/usePermissions'
import { useLanguage } from '../contexts/LanguageContext'

const LEVELS = Array.from({ length: 19 }, (_, i) => i + 6) // 6..24
const ITEMS_PER_PAGE = 18
const STORAGE_KEY = 'voidmapper_projects_filters'

function loadSavedFilters() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

export default function ProjectsPage({ onSelectProject, onNavigate, user }) {
  const perms = usePermissions(user)
  const { t } = useLanguage()

  const saved = useMemo(loadSavedFilters, [])

  const [search,          setSearch]          = useState(saved.search ?? '')
  const [activeFilter,    setActiveFilter]    = useState(saved.activeFilter ?? null)
  const [activeLevel,     setActiveLevel]     = useState(saved.activeLevel ?? '')
  const [datePeriod,      setDatePeriod]      = useState(saved.datePeriod ?? '')
  const [customFrom,      setCustomFrom]      = useState(saved.customFrom ?? '')
  const [customTo,        setCustomTo]        = useState(saved.customTo ?? '')
  const [projects,        setProjects]        = useState([])
  const [page,            setPage]            = useState(1)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [deleting,        setDeleting]        = useState(false)
  const [deleteErr,       setDeleteErr]       = useState(null)

  useEffect(() => {
    getProjects().then(setProjects).catch(console.error)
  }, [])

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        search, activeFilter, activeLevel, datePeriod, customFrom, customTo,
      }))
    } catch { /* ignore */ }
  }, [search, activeFilter, activeLevel, datePeriod, customFrom, customTo])

  useEffect(() => { setPage(1) }, [search, activeFilter, activeLevel, datePeriod, customFrom, customTo])

  const FILTER_CHIPS = [
    { key: 'danger',  label: t('projects.filterDeformations')   },
    { key: 'warning', label: t('projects.filterRehabilitating') },
    { key: 'info',    label: t('projects.filterErrors')         },
  ]

  function matchesDateFilter(p) {
    if (!datePeriod) return true

    const dates = [p.created_at, p.rawDate]
      .map(d => d ? new Date(d) : null)
      .filter(d => d && !isNaN(d.getTime()))

    if (dates.length === 0) return true

    if (datePeriod === '30d') {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 30)
      return dates.some(d => d >= cutoff)
    }
    if (datePeriod === '90d') {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 90)
      return dates.some(d => d >= cutoff)
    }
    if (/^\d{4}$/.test(datePeriod)) {
      const year = parseInt(datePeriod, 10)
      return dates.some(d => d.getFullYear() === year)
    }
    if (datePeriod === 'custom') {
      const from = customFrom ? new Date(customFrom + 'T00:00:00') : null
      const to   = customTo   ? new Date(customTo   + 'T23:59:59') : null
      return dates.some(d => {
        if (from && d < from) return false
        if (to   && d > to)   return false
        return true
      })
    }
    return true
  }

  const filtered = projects.filter((p) => {
    const q        = search.trim().toLowerCase()
    const statuses = Array.isArray(p.statuses) ? p.statuses : []

    const matchesSearch = !q
      || p.code.toLowerCase().includes(q)
      || (p.fileName ?? '').toLowerCase().includes(q)
      || (p.level != null && String(p.level).includes(q))
      || statuses.some(s => (s.variant ?? '').toLowerCase().includes(q))

    const matchesStatus = !activeFilter || statuses.some(s => s.variant === activeFilter)

    const matchesLevel = activeLevel === '' || (p.level != null && p.level === parseInt(activeLevel, 10))

    return matchesSearch && matchesStatus && matchesLevel && matchesDateFilter(p)
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  function toggleFilter(key) {
    setActiveFilter((prev) => (prev === key ? null : key))
  }

  function handleDatePeriodChange(value) {
    setDatePeriod(value)
    if (value !== 'custom') {
      setCustomFrom('')
      setCustomTo('')
    }
  }

  async function handleDeleteConfirm() {
    setDeleting(true)
    setDeleteErr(null)
    try {
      await deleteProjectCascade(pendingDeleteId)
      setProjects(prev => prev.filter(p => p.id !== pendingDeleteId))
      setPendingDeleteId(null)
    } catch (err) {
      setDeleteErr(err?.message ?? 'Erro ao excluir projeto')
    } finally {
      setDeleting(false)
    }
  }

  function handleDeleteCancel() {
    if (deleting) return
    setPendingDeleteId(null)
    setDeleteErr(null)
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
          {perms.canCreateProject && (
            <button
              type="button"
              onClick={() => onNavigate?.('novo-projeto')}
              className="h-10 px-5 bg-brand-500 text-white text-sm font-semibold rounded-full whitespace-nowrap hover:bg-brand-600 transition-colors"
            >
              {t('projects.newProject')}
            </button>
          )}
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
            <option value="">{t('projects.allLevels')}</option>
            {LEVELS.map(l => (
              <option key={l} value={l}>{t('projects.level')} {l}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-ink-500" strokeWidth={2} />
        </div>

        {/* Date period dropdown */}
        <div className="relative inline-flex items-center">
          <select
            value={datePeriod}
            onChange={e => handleDatePeriodChange(e.target.value)}
            className={cn(
              'h-[26px] appearance-none pl-3 pr-7 rounded-md border text-[12px] font-medium transition-colors cursor-pointer outline-none',
              datePeriod !== ''
                ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                : 'border-border-soft bg-surface text-ink-700 hover:bg-page',
            )}
          >
            <option value="">{t('projects.dateAll')}</option>
            <option value="30d">{t('projects.dateLast30')}</option>
            <option value="90d">{t('projects.dateLast90')}</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="custom">{t('projects.dateCustom')}</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-ink-500" strokeWidth={2} />
        </div>

        {/* Custom date range inputs */}
        {datePeriod === 'custom' && (
          <>
            <input
              type="date"
              value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
              title={t('projects.dateFrom')}
              className="h-[26px] px-2 rounded-md border border-border-soft bg-surface text-ink-700 text-[12px] outline-none focus:border-brand-500 transition-colors"
            />
            <span className="text-ink-400 text-[12px]">—</span>
            <input
              type="date"
              value={customTo}
              onChange={e => setCustomTo(e.target.value)}
              title={t('projects.dateTo')}
              className="h-[26px] px-2 rounded-md border border-border-soft bg-surface text-ink-700 text-[12px] outline-none focus:border-brand-500 transition-colors"
            />
          </>
        )}

        {/* Status chips */}
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
        {paginated.length > 0 ? (
          <>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 4xl:grid-cols-4 5xl:grid-cols-5 gap-4 3xl:gap-5 4xl:gap-6">
              {paginated.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onClick={() => onSelectProject?.(p)}
                  onDelete={id => setPendingDeleteId(id)}
                  canDelete={perms.canDeleteProject}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 px-6 pb-4 pt-2 border-t border-border-soft">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className={cn(
                    'w-7 h-7 inline-flex items-center justify-center rounded-md border transition-colors',
                    safePage <= 1
                      ? 'border-border-soft text-ink-300 cursor-not-allowed'
                      : 'border-border-soft text-ink-600 hover:bg-page cursor-pointer',
                  )}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[13px] text-ink-500 tabular-nums select-none">
                  {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className={cn(
                    'w-7 h-7 inline-flex items-center justify-center rounded-md border transition-colors',
                    safePage >= totalPages
                      ? 'border-border-soft text-ink-300 cursor-not-allowed'
                      : 'border-border-soft text-ink-600 hover:bg-page cursor-pointer',
                  )}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 flex items-center justify-center text-ink-400 text-sm">
            {t('projects.noResults')}
          </div>
        )}
      </Card>

      {/* Centered delete confirmation modal */}
      {pendingDeleteId && (
        <ConfirmModal
          message="Tem certeza que deseja excluir este projeto? Esta ação removerá levantamentos, imagens e monitoramentos vinculados."
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          loading={deleting}
          error={deleteErr}
        />
      )}
    </>
  )
}
