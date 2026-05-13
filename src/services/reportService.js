import { supabase } from '../lib/supabase.js'
import { getMetrics, getRecentSurveys, getRehabilitatedProjects } from './surveyService.js'
import { getMonitoringRows } from './monitoringService.js'

export async function getWeeklyReportFull(start, end) {
  const [metrics, surveys, rehab, monitoring] = await Promise.all([
    getMetrics(),
    getRecentSurveys(),
    getRehabilitatedProjects(),
    getMonitoringRows(),
  ])

  const { data: allProjects } = await supabase
    .from('projects')
    .select('id, code, statuses, date, file_name, notes, survey_count, project_images(url)')
    .order('updated_at', { ascending: false })

  const toBlock = p => ({
    id:       p.id,
    code:     p.code,
    fileName: p.file_name,
    notes:    p.notes,
    surveys:  p.survey_count,
    date:     p.date ? new Date(p.date).toLocaleDateString('pt-BR') : '—',
    images:   (p.project_images ?? []).map(img => img.url).slice(0, 2),
  })

  const deformationProjects = (allProjects ?? [])
    .filter(p => Array.isArray(p.statuses) && p.statuses.some(s => s.variant === 'danger'))
    .map(toBlock)

  const errorProjects = (allProjects ?? [])
    .filter(p => Array.isArray(p.statuses) && p.statuses.some(s => s.variant === 'info'))
    .map(toBlock)

  return { metrics, surveys, rehab, monitoring, deformationProjects, errorProjects }
}

export async function getWeeklyReport() {
  try {
    return await getWeeklyReportFull()
  } catch {
    return null
  }
}

export async function generateReport(payload) {
  const {
    periodStart, periodEnd, observations, conclusion,
    newSurveys = 0, deformations = 0, rehabilitation = 0, errors = 0,
  } = payload ?? {}

  const { data, error } = await supabase.from('reports').insert({
    week_start:     periodStart ? new Date(periodStart).toISOString() : new Date().toISOString(),
    week_end:       periodEnd   ? new Date(periodEnd).toISOString()   : new Date().toISOString(),
    new_surveys:    Number(newSurveys)     || 0,
    deformations:   Number(deformations)   || 0,
    rehabilitation: Number(rehabilitation) || 0,
    errors:         Number(errors)         || 0,
    observations:   observations ?? null,
    conclusion:     conclusion   ?? null,
  }).select().single()

  if (error) throw new Error(error.message)
  return { ...data, generatedAt: data.created_at }
}
