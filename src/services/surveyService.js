import { apiFetch } from './api.js'
import { SURVEY_ANALYTICS_DATA, MONTHLY_ANALYTICS } from '../data/dashboard.js'

export async function getMetrics() {
  const { data } = await apiFetch('/dashboard/metrics')
  return data
}

export async function getRecentSurveys() {
  const { data } = await apiFetch('/dashboard/recent-surveys')
  return data.surveys
}

export async function getRehabilitatedProjects() {
  const { data } = await apiFetch('/dashboard/rehabilitated-projects')
  return data.projects
}

export async function getSurveyAnalytics(period, month) {
  const qs = month !== undefined
    ? `?period=${period}&month=${month}`
    : `?period=${period}`
  try {
    const { data } = await apiFetch(`/dashboard/analytics${qs}`)
    return data.chartData
  } catch {
    // Fallback to static mock if backend unreachable
    if (period === 'monthly') return MONTHLY_ANALYTICS[month ?? 0]
    return SURVEY_ANALYTICS_DATA[period] ?? SURVEY_ANALYTICS_DATA.weekly
  }
}

export async function getReportData() {
  // Legacy — kept for backward compatibility
  return {}
}
