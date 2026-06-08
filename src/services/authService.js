import { supabase } from '../lib/supabase.js'

function buildInitials(name) {
  return (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'US'
}

async function fetchProfile(userId) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
  return data
}

async function upsertProfile(userId, updates) {
  const { error } = await supabase.from('profiles').upsert({ id: userId, ...updates }, { onConflict: 'id' })
  if (error) console.error('Profile upsert error:', error)
}

function toUser(sbUser, profile) {
  return {
    id:              sbUser.id,
    email:           sbUser.email,
    name:            profile?.name            ?? sbUser.user_metadata?.name ?? '',
    role:            profile?.role            ?? 'Usuário',
    initials:        profile?.initials        ?? buildInitials(profile?.name ?? ''),
    profileComplete: profile?.profile_complete ?? false,
    appRole:         profile?.app_role ?? undefined,
  }
}

export async function login({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  await upsertProfile(data.user.id, { email: data.user.email }).catch(() => {})
  const profile = await fetchProfile(data.user.id)
  return toUser(data.user, profile)
}

export async function register({ email, name, password }) {
  const initials = buildInitials(name)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, initials } },
  })
  if (error) throw new Error(error.message)
  // Trigger creates profile automatically; upsert as fallback
  await upsertProfile(data.user.id, { name, initials, role: 'Usuário', profile_complete: false })
  return toUser(data.user, { name, initials, role: 'Usuário', profile_complete: false })
}

export async function logout() {
  await supabase.auth.signOut()
  return { success: true }
}

export async function forgotPassword({ email }) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  })
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function getMe() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Sessão expirada. Faça login novamente.')
  let profile = await fetchProfile(user.id)
  if (!profile) {
    // Auto-create profile for users who registered before the profiles table existed
    const name = user.user_metadata?.name ?? ''
    await upsertProfile(user.id, {
      name,
      email:            user.email,
      initials:         buildInitials(name),
      role:             'Usuário',
      profile_complete: false,
    }).catch(console.error)
    profile = await fetchProfile(user.id)
  } else if (!profile.email) {
    // Sync email if missing (after ADMIN_SETUP migration)
    await upsertProfile(user.id, { email: user.email }).catch(console.error)
    profile = { ...profile, email: user.email }
  }
  return toUser(user, profile)
}

export async function updateProfile(profile) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const updates = {}
  if (profile.name            !== undefined) updates.name            = profile.name
  if (profile.role            !== undefined) updates.role            = profile.role
  if (profile.initials        !== undefined) updates.initials        = profile.initials
  if (profile.profileComplete !== undefined) updates.profile_complete = profile.profileComplete
  await upsertProfile(user.id, updates)
  return profile
}

export async function changePassword({ currentPassword, newPassword }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  // Verify current password by re-signing in
  const { error: verifyErr } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword })
  if (verifyErr) throw new Error('Senha atual incorreta')
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw new Error(error.message)
  return { success: true }
}
