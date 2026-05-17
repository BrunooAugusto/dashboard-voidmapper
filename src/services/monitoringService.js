import { supabase } from '../lib/supabase.js'

// ── pure helpers ──────────────────────────────────────────────────────────────

function daysUntil(dateStr, frequencyDays) {
  const next = new Date(dateStr)
  next.setDate(next.getDate() + frequencyDays)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((next.getTime() - today.getTime()) / 86_400_000)
}

function statusFromDays(days) {
  if (days === null) return { color: 'neutral', label: 'Sem levantamento' }
  if (days === 0)    return { color: 'danger',  label: 'Hoje' }
  if (days < 0)      return { color: 'danger',  label: `Vencido há ${Math.abs(days)} dia${Math.abs(days) === 1 ? '' : 's'}` }
  if (days <= 3)     return { color: 'warning', label: `${days} dia${days === 1 ? '' : 's'}` }
  return               { color: 'success', label: `${days} dia${days === 1 ? '' : 's'}` }
}

// ── getMonitoringRows ─────────────────────────────────────────────────────────
//
// Returns an array of rows. Every computed field (last survey, count, days)
// comes exclusively from the `surveys` table — never from stored monitoring
// columns (last_survey, survey_count) or project.survey_count.
//
export async function getMonitoringRows() {
  // ── 1. fetch monitoring config rows ────────────────────────────────────────
  const { data: monitorings, error: me } = await supabase
    .from('monitoring')
    .select('id, area, project_id, project_name, frequency_days')
    .order('area', { ascending: true })
  if (me) throw new Error(me.message)
  if (!monitorings?.length) return []

  // ── 2. collect all linked project_ids ──────────────────────────────────────
  const projectIds = [...new Set(monitorings.map(m => m.project_id).filter(Boolean))]

  // ── 3. fetch those projects ────────────────────────────────────────────────
  const projectsById = {}
  if (projectIds.length > 0) {
    const { data: projects, error: pe } = await supabase
      .from('projects')
      .select('id, code')
      .in('id', projectIds)
    if (pe) console.error('[monitoring] projects error:', pe.message)
    for (const p of projects ?? []) projectsById[p.id] = p
  }

  // ── 4. fetch ALL surveys for those projects in ONE query ───────────────────
  //      Only date + created_at — never survey_count / project.survey_count.
  const surveysById = {}   // { [project_id]: Survey[] }
  if (projectIds.length > 0) {
    const { data: surveys, error: se } = await supabase
      .from('surveys')
      .select('id, project_id, date, created_at')
      .in('project_id', projectIds)
    if (se) console.error('[monitoring] surveys error:', se.message)
    for (const s of surveys ?? []) {
      if (!surveysById[s.project_id]) surveysById[s.project_id] = []
      surveysById[s.project_id].push(s)
    }
  }

  // ── 5. build one output row per monitoring entry ───────────────────────────
  const rows = monitorings.map(monitoring => {
    const project = monitoring.project_id ? (projectsById[monitoring.project_id] ?? null) : null
    const surveys = monitoring.project_id ? (surveysById[monitoring.project_id] ?? []) : []

    // sort surveys newest-first (prefer .date, fallback .created_at)
    const sorted = [...surveys].sort(
      (a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at)
    )
    const latestSurvey     = sorted[0] ?? null
    const latestSurveyDate = latestSurvey ? (latestSurvey.date || latestSurvey.created_at) : null
    const surveyRecordsCount = surveys.length   // count of rows, NEVER project.survey_count

    const nextSurveyDate = latestSurveyDate
      ? (() => { const d = new Date(latestSurveyDate); d.setDate(d.getDate() + monitoring.frequency_days); return d.toISOString() })()
      : null

    const daysRemaining = latestSurveyDate
      ? daysUntil(latestSurveyDate, monitoring.frequency_days)
      : null

    const { color: statusColor, label: statusLabel } = statusFromDays(daysRemaining)

    // ── debug logs ───────────────────────────────────────────────────────────
    console.log('[monitoring]', monitoring)
    console.log('[monitoring] project', project)
    console.log('[monitoring] surveys', surveys)
    console.log('[monitoring] computed', {
      latestSurveyDate,
      surveyRecordsCount,
      nextSurveyDate,
      daysRemaining,
      statusColor,
      statusLabel,
    })

    return {
      // official shape
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
      // aliases consumed by MonitoringPage table cells
      id:            monitoring.id,
      project:       project?.code ?? monitoring.project_name ?? '—',
      surveys:       surveyRecordsCount,
      surveyCount:   surveyRecordsCount,
      lastSurvey:    latestSurveyDate ? new Date(latestSurveyDate).toLocaleDateString('pt-BR') : '—',
      daysUntilNext: daysRemaining,
      // raw fields needed by MonitoringEditPage
      project_id:    monitoring.project_id,
      frequency_days: monitoring.frequency_days,
    }
  })

  console.table(rows.map(r => ({
    área:                r.area,
    projeto:             r.projectCode,
    'Nº Levantamentos':  r.surveyRecordsCount,
    'Último':            r.lastSurvey,
    'Próximo':           r.nextSurveyDate ? new Date(r.nextSurveyDate).toLocaleDateString('pt-BR') : '—',
    'Dias Restantes':    r.daysRemaining ?? '—',
    status:              r.statusColor,
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
