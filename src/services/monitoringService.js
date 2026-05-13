import { apiFetch } from './api.js'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

function transform(r) {
  return {
    ...r,
    project:    r.projectName,
    surveys:    r.surveyCount,
    lastSurvey: formatDate(r.lastSurvey),
  }
}

export async function getMonitoringRows() {
  const { data } = await apiFetch('/monitoring')
  return data.rows.map(transform)
}

export async function createMonitoringRow(payload) {
  const { data } = await apiFetch('/monitoring', {
    method: 'POST',
    body:   JSON.stringify(payload),
  })
  return transform(data.row)
}

export async function updateMonitoringRow(id, payload) {
  const { data } = await apiFetch(`/monitoring/${id}`, {
    method: 'PUT',
    body:   JSON.stringify(payload),
  })
  return transform(data.row)
}
