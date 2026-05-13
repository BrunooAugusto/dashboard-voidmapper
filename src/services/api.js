export const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'

let _onUnauthorized = null
export function setUnauthorizedHandler(fn) { _onUnauthorized = fn }

export async function apiFetch(path, options = {}) {
  const url   = `${BASE_URL}${path}`
  const token = localStorage.getItem('voidmapper_token')
  const res   = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  })
  if (res.status === 401) {
    localStorage.removeItem('voidmapper_token')
    _onUnauthorized?.()
    throw new Error('Sessão expirada. Faça login novamente.')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `API ${res.status}: ${res.statusText}`)
  }
  return res.json()
}

// For multipart/form-data — do NOT set Content-Type (browser adds boundary automatically)
export async function apiUpload(path, formData) {
  const url   = `${BASE_URL}${path}`
  const token = localStorage.getItem('voidmapper_token')
  const res   = await fetch(url, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  })
  if (res.status === 401) {
    localStorage.removeItem('voidmapper_token')
    _onUnauthorized?.()
    throw new Error('Sessão expirada. Faça login novamente.')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `API ${res.status}: ${res.statusText}`)
  }
  return res.json()
}
