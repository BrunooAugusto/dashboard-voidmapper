import { apiFetch } from './api.js'

export async function getWeeklyReport() {
  try {
    const { data } = await apiFetch('/reports/weekly')
    return data
  } catch {
    const local = localStorage.getItem('voidmapper_weekly_report')
    return local ? JSON.parse(local) : null
  }
}

export async function getWeeklyReportFull() {
  const { data } = await apiFetch('/reports/weekly')
  return data
}

export async function generateReport(payload) {
  try {
    const { data } = await apiFetch('/reports/generate', {
      method: 'POST',
      body:   JSON.stringify(payload),
    })
    return data
  } catch {
    localStorage.setItem('voidmapper_weekly_report', JSON.stringify(payload))
    return { saved: true, local: true }
  }
}
