import { supabase } from '../lib/supabase.js'

function daysUntilNext(lastSurvey, frequencyDays) {
  const next = new Date(lastSurvey)
  next.setDate(next.getDate() + frequencyDays)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((next.getTime() - today.getTime()) / 86_400_000)
}

function transform(r) {
  const days = r.last_survey != null ? daysUntilNext(r.last_survey, r.frequency_days) : null
  return {
    ...r,
    // camelCase aliases for UI compatibility
    project:       r.project_name,
    projectName:   r.project_name,
    surveys:       r.survey_count,
    surveyCount:   r.survey_count,
    frequencyDays: r.frequency_days,
    lastSurvey:    r.last_survey ? new Date(r.last_survey).toLocaleDateString('pt-BR') : '—',
    daysUntilNext: days,
  }
}

export async function getMonitoringRows() {
  const { data, error } = await supabase
    .from('monitoring')
    .select('*')
    .order('area', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map(transform)
}

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
      project_id:     projectId ?? null,
    })
    .select().single()
  if (error) throw new Error(error.message)
  return transform(data)
}

export async function updateMonitoringRow(id, payload) {
  const updates = {}
  if (payload.area          !== undefined) updates.area           = payload.area
  if (payload.projectName   !== undefined) updates.project_name   = payload.projectName
  if (payload.frequencyDays !== undefined) updates.frequency_days = parseInt(payload.frequencyDays)
  if (payload.lastSurvey    !== undefined) updates.last_survey    = payload.lastSurvey ? new Date(payload.lastSurvey).toISOString() : null
  if (payload.surveyCount   !== undefined) updates.survey_count   = parseInt(payload.surveyCount)

  const { data, error } = await supabase
    .from('monitoring').update(updates).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return transform(data)
}

export async function deleteMonitoringRow(id) {
  const { error } = await supabase.from('monitoring').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return { success: true }
}
