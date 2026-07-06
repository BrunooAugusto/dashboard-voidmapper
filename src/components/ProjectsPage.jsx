import { useState, useEffect, useMemo } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../lib/cn'
import Card from './Card'
import ProjectCard from './ProjectCard'
import ConfirmModal from './ConfirmModal'
import FolderModal from './FolderModal'
import FolderSection from './FolderSection'
import SearchInput from './SearchInput'
import { getProjects, deleteProjectCascade } from '../services/projectService'
import { getFolders, createFolder, renameFolder, deleteFolder, moveProjectToFolder } from '../services/projectFolderService'
import { usePermissions } from '../hooks/usePermissions'
import { useLanguage } from '../contexts/LanguageContext'

const LEVELS = Array.from({ length: 19 }, (_, i) => i + 6) // 6..24
const ITEMS_PER_PAGE = 18
const STORAGE_KEY = 'voidmapper_projects_filters'
const FOLDERS_STORAGE_KEY = 'voidmapper_projects_folders_expanded'

function loadSavedFilters() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function loadSavedExpandedFolders() {
  try {
    const raw = sessionStorage.getItem(FOLDERS_STORAGE_KEY)
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

  const [folders,          setFolders]          = useState([])
  const [expandedFolders,  setExpandedFolders]  = useState(loadSavedExpandedFolders)
  const [folderModal,      setFolderModal]      = useState(null) // { mode: 'create' } | { mode: 'rename', folder }
  const [folderSaving,     setFolderSaving]     = useState(false)
  const [folderErr,        setFolderErr]        = useState(null)
  const [pendingDeleteFolder, setPendingDeleteFolder] = useState(null)
  const [folderDeleting,   setFolderDeleting]   = useState(false)
  const [folderDeleteErr,  setFolderDeleteErr]  = useState(null)

  useEffect(() => {
    getProjects().then(setProjects).catch(console.error)
    getFolders().then(setFolders).catch(console.error)
  }, [])

  useEffect(() => {
    try { sessionStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(expandedFolders)) } catch { /* ignore */ }
  }, [expandedFolders])

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

    // Use only the survey date (rawDate = project.date field) — never created_at
    const surveyDate = p.rawDate ? new Date(p.rawDate) : null
    if (!surveyDate || isNaN(surveyDate.getTime())) return true

    if (datePeriod === '30d') {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 30)
      return surveyDate >= cutoff
    }
    if (datePeriod === '90d') {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 90)
      return surveyDate >= cutoff
    }
    if (/^\d{4}$/.test(datePeriod)) {
      return surveyDate.getFullYear() === parseInt(datePeriod, 10)
    }
    if (datePeriod === 'custom') {
      const from = customFrom ? new Date(customFrom + 'T00:00:00') : null
      const to   = customTo   ? new Date(customTo   + 'T23:59:59') : null
      if (from && surveyDate < from) return false
      if (to   && surveyDate > to)   return false
      return true
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

  const folderGroups = new Map(folders.map(f => [f.id, []]))
  const ungrouped = []
  filtered.forEach((p) => {
    if (p.folderId && folderGroups.has(p.folderId)) folderGroups.get(p.folderId).push(p)
    else ungrouped.push(p)
  })

  const totalPages = Math.max(1, Math.ceil(ungrouped.length / ITEMS_PER_PAGE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = ungrouped.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  function toggleFilter(key) {
    setActiveFilter((prev) => (prev === key ? null : key))
  }

  function toggleFolderExpanded(folderId) {
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !(prev[folderId] ?? true) }))
  }

  async function assignProjectToFolder(projectId, folderId) {
    const prevProjects = projects
    setProjects((ps) => ps.map((p) => (p.id === projectId ? { ...p, folderId } : p)))
    try {
      await moveProjectToFolder(projectId, folderId)
    } catch (err) {
      console.error(err)
      setProjects(prevProjects)
    }
  }

  function handleDropOnFolder(e, folderId) {
    const projectId = parseInt(e.dataTransfer.getData('text/plain'), 10)
    if (!isNaN(projectId)) assignProjectToFolder(projectId, folderId)
  }

  function handleFolderModalSubmit(name) {
    if (!folderModal) return
    setFolderSaving(true)
    setFolderErr(null)
    const run = folderModal.mode === 'create'
      ? createFolder(name)
      : renameFolder(folderModal.folder.id, name)
    run.then((result) => {
      setFolders((fs) => {
        const next = folderModal.mode === 'create'
          ? [...fs, result]
          : fs.map((f) => (f.id === result.id ? result : f))
        return next.sort((a, b) => a.name.localeCompare(b.name))
      })
      if (folderModal.mode === 'create') {
        setExpandedFolders((prev) => ({ ...prev, [result.id]: true }))
      }
      setFolderModal(null)
    }).catch((err) => {
      setFolderErr(err?.message ?? 'Erro ao salvar pasta')
    }).finally(() => {
      setFolderSaving(false)
    })
  }

  function handleFolderModalCancel() {
    if (folderSaving) return
    setFolderModal(null)
    setFolderErr(null)
  }

  async function handleDeleteFolderConfirm() {
    setFolderDeleting(true)
    setFolderDeleteErr(null)
    try {
      await deleteFolder(pendingDeleteFolder.id)
      setFolders((fs) => fs.filter((f) => f.id !== pendingDeleteFolder.id))
      setProjects((ps) => ps.map((p) => (p.folderId === pendingDeleteFolder.id ? { ...p, folderId: null } : p)))
      setPendingDeleteFolder(null)
    } catch (err) {
      setFolderDeleteErr(err?.message ?? 'Erro ao excluir pasta')
    } finally {
      setFolderDeleting(false)
    }
  }

  function handleDeleteFolderCancel() {
    if (folderDeleting) return
    setPendingDeleteFolder(null)
    setFolderDeleteErr(null)
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
              onClick={() => setFolderModal({ mode: 'create' })}
              className="h-10 px-5 border border-border-soft text-ink-700 text-sm font-semibold rounded-full whitespace-nowrap hover:bg-page transition-colors"
            >
              {t('projects.newFolder')}
            </button>
          )}
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

      {/* Folders */}
      {folders.map((folder) => (
        <FolderSection
          key={folder.id}
          folder={folder}
          count={folderGroups.get(folder.id)?.length ?? 0}
          expanded={expandedFolders[folder.id] ?? true}
          onToggle={() => toggleFolderExpanded(folder.id)}
          onRename={() => setFolderModal({ mode: 'rename', folder })}
          onDelete={() => setPendingDeleteFolder(folder)}
          onDrop={(e) => handleDropOnFolder(e, folder.id)}
          canRename={perms.canEditProject}
          canDelete={perms.canDeleteProject}
        >
          {(folderGroups.get(folder.id) ?? []).map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onClick={() => onSelectProject?.(p)}
              onDelete={id => setPendingDeleteId(id)}
              onRemoveFromFolder={id => assignProjectToFolder(id, null)}
              canDelete={perms.canDeleteProject}
            />
          ))}
        </FolderSection>
      ))}

      {/* Ungrouped projects grid */}
      {folders.length > 0 && ungrouped.length > 0 && (
        <h3 className="text-sm font-medium text-ink-500 mb-2 px-1">{t('projects.folder.ungroupedTitle')}</h3>
      )}
      {(folders.length === 0 || ungrouped.length > 0) && (
      <Card
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleDropOnFolder(e, null) }}
      >
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
      )}

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

      {/* Create / rename folder modal */}
      {folderModal && (
        <FolderModal
          title={folderModal.mode === 'create' ? t('projects.folder.createTitle') : t('projects.folder.renameTitle')}
          initialName={folderModal.mode === 'rename' ? folderModal.folder.name : ''}
          submitLabel={folderModal.mode === 'create' ? t('projects.folder.create') : t('projects.folder.rename')}
          placeholder={t('projects.folder.namePlaceholder')}
          onSubmit={handleFolderModalSubmit}
          onCancel={handleFolderModalCancel}
          loading={folderSaving}
          error={folderErr}
        />
      )}

      {/* Delete folder confirmation modal */}
      {pendingDeleteFolder && (
        <ConfirmModal
          message={t('projects.folder.deleteConfirm')}
          confirmLabel={t('projects.folder.delete')}
          onConfirm={handleDeleteFolderConfirm}
          onCancel={handleDeleteFolderCancel}
          loading={folderDeleting}
          error={folderDeleteErr}
        />
      )}
    </>
  )
}
