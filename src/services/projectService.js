import { apiFetch, apiUpload } from './api.js'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

function transform(p) {
  return { ...p, surveys: p.surveyCount, date: formatDate(p.date) }
}

export async function getProjects(search = '') {
  const qs      = search ? `?search=${encodeURIComponent(search)}` : ''
  const { data } = await apiFetch(`/projects${qs}`)
  return data.projects.map(transform)
}

export async function getProjectById(id) {
  const { data } = await apiFetch(`/projects/${id}`)
  return transform(data.project)
}

export async function getProjectDetail(id) {
  const { data } = await apiFetch(`/projects/${id}`)
  return transform(data.project)
}

export async function createProject(payload) {
  const { data } = await apiFetch('/projects', {
    method: 'POST',
    body:   JSON.stringify(payload),
  })
  return transform(data.project)
}

export async function updateProject(id, payload) {
  const { data } = await apiFetch(`/projects/${id}`, {
    method: 'PUT',
    body:   JSON.stringify(payload),
  })
  return transform(data.project)
}

export async function deleteProject(id) {
  await apiFetch(`/projects/${id}`, { method: 'DELETE' })
  return { success: true }
}

export async function uploadProjectImage(projectId, file) {
  const fd = new FormData()
  fd.append('image', file)
  const { data } = await apiUpload(`/projects/${projectId}/images`, fd)
  return data.image
}

export async function deleteProjectImage(projectId, imageId) {
  await apiFetch(`/projects/${projectId}/images/${imageId}`, { method: 'DELETE' })
}
