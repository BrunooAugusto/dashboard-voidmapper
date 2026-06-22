import { supabase } from '../lib/supabase.js'

export async function logAction({ action, entityType, entityId, entityName, projectId, description, oldValue, newValue } = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles').select('name, email').eq('id', user.id).maybeSingle()
    await supabase.from('audit_logs').insert({
      user_id:     user.id,
      user_name:   profile?.name  ?? user.user_metadata?.name ?? 'Desconhecido',
      user_email:  profile?.email ?? user.email ?? null,
      action,
      entity_type: entityType ?? null,
      entity_id:   entityId   != null ? String(entityId) : null,
      entity_name: entityName ?? null,
      project_id:  projectId  != null ? String(projectId) : null,
      old_value:   oldValue   ?? null,
      new_value:   newValue   ?? null,
      description: description ?? null,
    })
  } catch (err) {
    console.warn('[audit] failed to log:', err?.message)
  }
}

export async function getAuditLogs({ projectId, userId, action, entityType, search, dateFrom, dateTo, limit = 150 } = {}) {
  let q = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limit)
  if (projectId)  q = q.eq('project_id', String(projectId))
  if (userId)     q = q.eq('user_id', userId)
  if (action)     q = q.eq('action', action)
  if (entityType) q = q.eq('entity_type', entityType)
  if (dateFrom)   q = q.gte('created_at', dateFrom)
  if (dateTo)     q = q.lte('created_at', dateTo + 'T23:59:59')
  if (search)     q = q.or(`user_name.ilike.%${search}%,entity_name.ilike.%${search}%,description.ilike.%${search}%`)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getProjectAuditLogs(projectId, limit = 50) {
  const { data, error } = await supabase.from('audit_logs').select('*').eq('project_id', String(projectId)).order('created_at', { ascending: false }).limit(limit)
  if (error) throw new Error(error.message)
  return data ?? []
}

export const ACTION_LABELS = {
  create_project:    'Criou projeto',
  edit_project:      'Editou projeto',
  delete_project:    'Excluiu projeto',
  create_survey:     'Criou levantamento',
  edit_survey:       'Editou levantamento',
  delete_survey:     'Excluiu levantamento',
  add_image:         'Adicionou imagem',
  remove_image:      'Removeu imagem',
  change_status:     'Alterou status',
  change_rehab:      'Alterou reabilitacao',
  create_monitoring: 'Criou monitoramento',
  edit_monitoring:   'Editou monitoramento',
  delete_monitoring: 'Excluiu monitoramento',
  generate_report:   'Gerou relatorio',
  add_ltc:           'Adicionou arquivo LTC',
  add_stc:           'Adicionou arquivo STC',
  remove_ltc:        'Removeu arquivo LTC',
  remove_stc:        'Removeu arquivo STC',
}

export const ENTITY_LABELS = {
  project:    'Projeto',
  survey:     'Levantamento',
  image:      'Imagem',
  monitoring: 'Monitoramento',
  report:     'Relatorio',
}