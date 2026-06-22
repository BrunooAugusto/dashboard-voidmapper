import { supabase } from '../lib/supabase.js'
import { logAction } from './auditService.js'

export async function getProjectFiles(projectId) {
  const { data, error } = await supabase
    .from('project_files')
    .select('*')
    .eq('project_id', projectId)
    .order('uploaded_at', { ascending: true })
  if (error) {
    if (error.code === '42P01') return [] // table not yet created
    throw new Error(error.message)
  }
  return data ?? []
}

export async function uploadProjectFile(projectId, file, fileType) {
  const ext  = file.name.split('.').pop()
  const path = `${projectId}/${fileType}/${Date.now()}.${ext}`

  const { error: storageErr } = await supabase.storage
    .from('project-files')
    .upload(path, file)
  if (storageErr) throw new Error(storageErr.message)

  const { data: { publicUrl } } = supabase.storage
    .from('project-files')
    .getPublicUrl(path)

  const { data, error } = await supabase
    .from('project_files')
    .insert({ project_id: projectId, file_type: fileType, file_name: file.name, file_url: publicUrl })
    .select().single()
  if (error) throw new Error(error.message)

  logAction({
    action: `add_${fileType}`,
    entityType: 'project_file',
    entityId: data.id,
    entityName: file.name,
    projectId,
    description: `Adicionou arquivo ${fileType.toUpperCase()}`,
    newValue: { file_name: file.name },
  })

  return data
}

export async function addProjectFileLink(projectId, fileUrl, fileName, fileType) {
  const { data, error } = await supabase
    .from('project_files')
    .insert({ project_id: projectId, file_type: fileType, file_name: fileName || fileUrl, file_url: fileUrl })
    .select().single()
  if (error) throw new Error(error.message)

  logAction({
    action: `add_${fileType}`,
    entityType: 'project_file',
    entityId: data.id,
    entityName: fileName || fileUrl,
    projectId,
    description: `Adicionou link ${fileType.toUpperCase()}`,
    newValue: { file_url: fileUrl },
  })

  return data
}

export async function deleteProjectFile(fileId, fileUrl, fileType, projectId) {
  if (fileUrl?.includes('/project-files/')) {
    const storagePath = fileUrl.split('/project-files/')[1]
    if (storagePath) {
      await supabase.storage.from('project-files').remove([decodeURIComponent(storagePath)])
    }
  }

  const { error } = await supabase.from('project_files').delete().eq('id', fileId)
  if (error) throw new Error(error.message)

  logAction({
    action: `remove_${fileType}`,
    entityType: 'project_file',
    entityId: fileId,
    projectId,
    description: `Removeu arquivo ${fileType.toUpperCase()}`,
  })
}

export async function deleteAllProjectFiles(projectId) {
  const { data } = await supabase
    .from('project_files')
    .select('id, file_url')
    .eq('project_id', projectId)

  if (!data?.length) return

  const paths = data
    .map(f => f.file_url?.split('/project-files/')[1])
    .filter(Boolean)
    .map(p => decodeURIComponent(p))
  if (paths.length) {
    await supabase.storage.from('project-files').remove(paths)
  }

  await supabase.from('project_files').delete().eq('project_id', projectId)
}
