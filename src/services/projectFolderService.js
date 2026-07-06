import { supabase } from '../lib/supabase.js'

export async function getFolders() {
  const { data, error } = await supabase
    .from('project_folders')
    .select('*')
    .order('name', { ascending: true })
  if (error?.code === '42P01') return [] // tabela ainda não migrada
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createFolder(name) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('project_folders')
    .insert({ name, created_by: user?.id ?? null })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function renameFolder(id, name) {
  const { data, error } = await supabase
    .from('project_folders')
    .update({ name })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteFolder(id) {
  const { error } = await supabase.from('project_folders').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function moveProjectToFolder(projectId, folderId) {
  const { error } = await supabase
    .from('projects')
    .update({ folder_id: folderId })
    .eq('id', projectId)
  if (error) throw new Error(error.message)
}
