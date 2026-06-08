import { supabase } from '../lib/supabase.js'
import { logAction } from './auditService.js'

export const ROLE_LABELS = {
  admin:        'Administrador',
  gestor:       'Gestor',
  editor:       'Editor',
  visualizador: 'Visualizador',
}

export const APP_ROLES = [
  { value: 'admin',        label: 'Administrador' },
  { value: 'gestor',       label: 'Gestor'        },
  { value: 'editor',       label: 'Editor'        },
  { value: 'visualizador', label: 'Visualizador'  },
]

export async function getUsers() {
  // select('*') avoids failures when optional columns (app_role, email, status)
  // don't exist yet (SQL migration not run)
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin] getUsers error:', error.code, error.message)
    throw new Error('Erro ao buscar usuários: ' + error.message)
  }

  const rows = data ?? []
  console.log('[admin] profiles fetched:', rows.length, rows.map(r => r.email || r.id))

  return rows.map(p => ({
    id:        p.id,
    name:      p.name ?? p.full_name ?? '—',
    email:     p.email ?? '—',
    jobRole:   p.role  ?? '—',
    appRole:   p.app_role  ?? 'visualizador',
    status:    p.status    ?? 'ativo',
    createdAt: p.created_at,
  }))
}

export async function updateUserRole(userId, appRole, currentUser) {
  const { error } = await supabase
    .from('profiles')
    .update({ app_role: appRole, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function updateUserStatus(userId, status) {
  const { error } = await supabase
    .from('profiles')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (error) throw new Error(error.message)
  return { success: true }
}
