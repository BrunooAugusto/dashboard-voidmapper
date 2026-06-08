import { supabase } from '../lib/supabase.js'
import {
  parseLocalDate,
  getLatestSurveyDate,
  sortSurveysByDateDesc,
  formatDateBR,
  debugSurveyDates,
} from '../lib/surveyDates.js'

// ── pure helpers ──────────────────────────────────────────────────────────────

function daysUntil(latestDate, frequencyDays) {
  if (!latestDate || !frequencyDays) return null
  // latestDate is already a Date object (local-normalized)
  const last = new Date(latestDate.getTime())
  last.setHours(0, 0, 0, 0)
  const next = new Date(last.getTime())
  next.setDate(next.getDate() + Number(frequencyDays))
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((next.getTime() - today.getTime()) / 86_400_000)
}

function statusFromDays(days) {
  if (days === null || days === undefined) return { color: 'neutral', label: 'Sem levantamento' }
  if (days === 0) return { color: 'danger',  label: 'Hoje' }
  if (days < 0)   return { color: 'danger',  label: `Vencido há ${Math.abs(days)} dia${Math.abs(days) === 1 ? '' : 's'}` }
  if (days <= 3)  return { color: 'warning', label: `${days} dia${days === 1 ? '' : 's'}` }
  return            { color: 'success', label: `${days} dia${days === 1 ? '' : 's'}` }
}

// ── getMonitoringRows ─────────────────────────────────────────────────────────
export async function getMonitoringRows() {

  // 1. Fetch all monitoring config rows
  const { data: monitorings, error: me } = await supabase
    .from('monitoring')
    .select('id, area, project_id, project_name, frequency_days')
    .order('area', { ascending: true })
  if (me) throw new Error(me.message)
  if (!monitorings?.length) return []

  // 2. Fetch ALL projects for ID-lookup and name-based fallback
  const { data: allProjects, error: pe } = await supabase
    .from('projects')
    .select('id, code')
  if (pe) console.error('[monitoring] projects error:', pe.message)

  const projectsById   = {}
  const projectsByCode = {}
  for (const p of allProjects ?? []) {
    projectsById[p.id] = p
    if (p.code) projectsByCode[p.code.toLowerCase().trim()] = p
  }

  // 3. Resolve each monitoring row to a project (ID first, then name fallback)
  const resolvedProjectIds = new Set()
  const resolvedMap = {}  // monitoringId → project | null

  for (const m of monitorings) {
    let project = null
    if (m.project_id != null) project = projectsById[m.project_id] ?? null
    if (!project && m.project_name) {
      project = projectsByCode[m.project_name.toLowerCase().trim()] ?? null
    }
    resolvedMap[m.id] = project
    if (project) resolvedProjectIds.add(project.id)
  }

  // 4. Fetch ALL surveys for resolved projects in one query
  const surveysById = {}  // { [project_id]: Survey[] }
  if (resolvedProjectIds.size > 0) {
    const { data: surveys, error: se } = await supabase
      .from('surveys')
      .select('id, project_id, date, created_at')
      .in('project_id', [...resolvedProjectIds])
    if (se) console.error('[monitoring] surveys error:', se.message)
    for (const s of surveys ?? []) {
      if (!surveysById[s.project_id]) surveysById[s.project_id] = []
      surveysById[s.project_id].push(s)
    }
  }

  // 5. Build output rows
  const rows = monitorings.map(monitoring => {
    const project  = resolvedMap[monitoring.id]
    const surveys  = project ? (surveysById[project.id] ?? []) : []

    // Sort using the shared utility (parseLocalDate inside, no UTC drift)
    const sorted           = sortSurveysByDateDesc(surveys)
    const latestDate       = getLatestSurveyDate(surveys)  // Date | null
    const latestSurveyDate = latestDate?.toISOString() ?? null  // raw string for other consumers

    // Debug log for this monitoring entry
    if (surveys.length > 0) {
      debugSurveyDates(surveys, `monitoring[${monitoring.id}] ${monitoring.area}`)
    }

    const surveyRecordsCount = surveys.length

    const nextSurveyDate = latestDate
      ? (() => {
          const d = new Date(latestDate.getTime())
          d.setHours(0, 0, 0, 0)
          d.setDate(d.getDate() + monitoring.frequency_days)
          return d.toISOString()
        })()
      : null

    // daysUntil receives a Date object (already local-normalized)
    const daysRemaining = daysUntil(latestDate, monitoring.frequency_days)
    const { color: statusColor, label: statusLabel } = statusFromDays(daysRemaining)

    return {
      // canonical shape
      monitoringId:        monitoring.id,
      area:                monitoring.area,
      projectCode:         project?.code ?? monitoring.project_name ?? '—',
      projectName:         project?.code ?? monitoring.project_name ?? '—',
      frequencyDays:       monitoring.frequency_days,
      latestSurveyDate,
      surveyRecordsCount,
      nextSurveyDate,
      daysRemaining,
      statusColor,
      statusLabel,
      // aliases consumed by MonitoringPage / MonitoringEditPage
      id:             monitoring.id,
      project:        project?.code ?? monitoring.project_name ?? '—',
      surveys:        surveyRecordsCount,
      surveyCount:    surveyRecordsCount,
      lastSurvey:     latestDate ? formatDateBR(latestDate) : '—',
      daysUntilNext:  daysRemaining,
      project_id:     monitoring.project_id ?? project?.id ?? null,
      frequency_days: monitoring.frequency_days,
    }
  })

  // Summary debug table
  console.table(rows.map(r => ({
    id:               r.monitoringId,
    project_id:       r.project_id,
    projeto:          r.projectCode,
    surveys_found:    r.surveyRecordsCount,
    latestSurveyDate: r.latestSurveyDate ? r.latestSurveyDate.slice(0, 10) : '—',
    lastSurvey_fmt:   r.lastSurvey,
    daysRemaining:    r.daysRemaining ?? '—',
    status:           r.statusColor,
  })))

  return rows
}

// ── write operations ──────────────────────────────────────────────────────────

export async function createMonitoringRow({ area, projectId, projectName, frequencyDays }) {
  if (!area || !projectId || !frequencyDays) {
    throw new Error('area, projectId e frequencyDays são obrigatórios')
  }
  const { data, error } = await supabase
    .from('monitoring')
    .insert({
      area,
      project_id:     parseInt(projectId),
      project_name:   projectName ?? '',
      frequency_days: parseInt(frequencyDays),
    })
    .select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateMonitoringRow(id, { area, projectId, projectName, frequencyDays }) {
  const updates = {}
  if (area          !== undefined) updates.area           = area
  if (projectId     !== undefined) updates.project_id     = projectId ? parseInt(projectId) : null
  if (projectName   !== undefined) updates.project_name   = projectName
  if (frequencyDays !== undefined) updates.frequency_days = parseInt(frequencyDays)

  const { data, error } = await supabase
    .from('monitoring').update(updates).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteMonitoringRow(id) {
  const { error } = await supabase.from('monitoring').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return { success: true }
}