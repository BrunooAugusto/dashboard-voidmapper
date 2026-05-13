import { apiFetch } from './api.js'

export async function login({ email, password }) {
  const { data } = await apiFetch('/auth/login', {
    method: 'POST',
    body:   JSON.stringify({ email, password }),
  })
  localStorage.setItem('voidmapper_token', data.token)
  return data.user
}

export async function register({ email, name, password }) {
  const { data } = await apiFetch('/auth/register', {
    method: 'POST',
    body:   JSON.stringify({ email, name, password }),
  })
  localStorage.setItem('voidmapper_token', data.token)
  return data.user
}

export async function logout() {
  localStorage.removeItem('voidmapper_token')
  return { success: true }
}

export async function forgotPassword({ email }) {
  return { success: true }
}

export async function getMe() {
  const { data } = await apiFetch('/auth/me')
  return data.user
}

export async function updateProfile(profile) {
  const { data } = await apiFetch('/auth/me', {
    method: 'PUT',
    body:   JSON.stringify(profile),
  })
  return data.user
}

export async function changePassword({ currentPassword, newPassword }) {
  const { data } = await apiFetch('/auth/password', {
    method: 'PUT',
    body:   JSON.stringify({ currentPassword, newPassword }),
  })
  return data
}
