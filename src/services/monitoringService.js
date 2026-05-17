import { supabase } from '../lib/supabase.js'

// ── helpers ───────────────────────────────────────────────────────────────────

function calcDaysUntilNext(lastSurveyDate, frequencyDays) {
  const next = new Date(lastSurveyDate)
  next.setDate(next.getDate() + frequencyDays)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((next.getTime() - today.getTime()) / 86_400_000)
}

// ── read ──────────────────────────────────────────────────────────────────────

export async function getMonitoringRows() {
  // 1 — Fetch monitoring rows
  const { data: rows, error: me } = await supabase
    .from('monitoring')
    .select('*')
    .order('area', { ascending: true })
  if (me) throw new Error(me.message)
  if (!rows?.length) return []

  // 2 — Backfill: for rows still missing project_id, try to match by code once and persist
  const needsBackfill = rows.filter(r => !r.project_id && r.project_name)
  if (needsBackfill.length > 0) {
    const names = needsBackfill.map(r => r.project_name)
    const { data: matched } = await supabase
      .from('projects')
      .select('id, code')
      .in('code', names)

    const codeToId = Object.fromEntries((matched ?? []).map(p => [p.code, p.id]))

    await Promise.all(
      needsBackfill.map(async r => {
        const pid = codeToId[r.project_name]
        if (pid) {
          await supabase.from('monitoring').update({ project_id: pid }).eq('id', r.id)
          r.project_id = pid  // update in-memory so this run benefits too
          console.log(`[monitoring] backfill row ${r.id} "${r.project_name}" → project_id=${pid}`)
        }
      })
    )
  }

  // 3 — Collect every project_id that is now resolved
  const projectIds = [...new Set(rows.map(r => r.project_id).filter(Boolean))]

  // 4 — Fetch surveys for all those projects in one query
  //     Only id / project_id / date / created_at needed — never survey_count
  const surveysMap = {}   // { [project_id]: Survey[] }
  if (projectIds.length > 0) {
    const { data: surveys, error: se } = await supabase
      .from('surveys')
      .select('id, project_id, date, created_at')
      .in('project_id', projectIds)
    if (se) console.error('[monitoring] surveys fetch error:', se.message)

    for (const s of surveys ?? []) {
      if (!surveysMap[s.project_id]) surveysMap[s.project_id] = []
      surveysMap[s.project_id].push(s)
    }
  }

  // 5 — Transform each monitoring row with live survey data
  return rows.map(r => {
    const pid              = r.project_id ?? null
    const surveysForProject = pid ? (surveysMap[pid] ?? []) : []

    // Sort by date desc (fallback to created_at)
    const sorted = [...surveysForProject].sort((a, b) =>
      new Date(b.date || b.created_at) - new Date(a.date || a.created_at)
    )

    const latestSurvey     = sorted[0] ?? null
    const latestSurveyDate = latestSurvey ? (latestSurvey.date || latestSurvey.created_at) : null

    // Use real survey date. Fall back to monitoring.last_survey only if no surveys exist.
    const lastSurveyRaw = latestSurveyDate ?? r.last_survey

    // Nº de Levantamentos = count of survey rows — never project.survey_count
    const surveyRowCount = surveysForProject.length

    const nextSurveyDate = lastSurveyRaw
      ? (() => { const d = new Date(lastSurveyRaw); d.setDate(d.getDate() + r.frequency_days); return d })()
      : null

    const daysRemaining = lastSurveyRaw ? calcDaysUntilNext(lastSurveyRaw, r.frequency_days) : null

    console.log('[monitoring]', {
      'monitoring.id':         r.id,
      'monitoring.project_id': pid ?? '— not linked',
      'project encontrado':    pid ? `id:${pid}` : '— no match',
      'surveys encontrados':   surveyRowCount,
      latestSurveyDate:        latestSurveyDate ?? `— (fallback: ${r.last_survey ?? 'none'})`,
      nextSurveyDate:          nextSurveyDate?.toLocaleDateString('pt-BR') ?? '—',
      daysRemaining:           daysRemaining ?? '—',
    })

    return {
      ...r,
      project:       r.project_name,
      projectName:   r.project_name,
      surveys:       surveyRowCount,
      surveyCount:   surveyRowCount,
      frequencyDays: r.frequency_days,
      lastSurvey:    lastSurveyRaw ? new Date(lastSurveyRaw).toLocaleDateString('pt-BR') : '—',
      daysUntilNext: daysRemaining,
    }
  })
}

// ── write ─────────────────────────────────────────────────────────────────────

export async function createMonitoringRow(payload) {
  const { area, projectName, frequencyDays, lastSurvey, surveyCount = 0, projectId } = payload
  if (!area || !projectName || !frequencyDays) {
    throw new Error('area, projectName e frequencyDays são obrigatórios')
  }
  const { data, error } = await supabase
    .from('monitoring')
    .insert({
      area,
      project_name:   projectName,
      frequency_days: parseInt(frequencyDays),
      last_survey:    lastSurvey ? new Date(lastSurvey).toISOString() : null,
      survey_count:   parseInt(surveyCount) || 0,
      project_id:     projectId ? parseInt(projectId) : null,
    })
    .select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateMonitoringRow(id, payload) {
  const updates = {}
  if (payload.area          !== undefined) updates.area           = payload.area
  if (payload.projectName   !== undefined) updates.project_name   = payload.projectName
  if (payload.frequencyDays !== undefined) updates.frequency_days = parseInt(payload.frequencyDays)
  if (payload.lastSurvey    !== undefined) updates.last_survey    = payload.lastSurvey ? new Date(payload.lastSurvey).toISOString() : null
  if (payload.surveyCount   !== undefined) updates.survey_count   = parseInt(payload.surveyCount)
  if (payload.projectId     !== undefined) updates.project_id     = payload.projectId ? parseInt(payload.projectId) : null

  const { data, error } = await supabase.from('monitoring').update(updates).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteMonitoringRow(id) {
  const { error } = await supabase.from('monitoring').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return { success: true }
}
