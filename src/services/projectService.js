import { supabase } from '../lib/supabase.js'
import { logAction } from './auditService.js'
import { getLatestSurveyDate, sortSurveysByDateDesc, formatDateBR, debugSurveyDates } from '../lib/surveyDates.js'
import { deleteAllProjectFiles } from './projectFilesService.js'

function toLocaleDatePT(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function nullableFloat(v) {
  if (v == null || v === '') return null
  const n = parseFloat(v)
  return isNaN(n) ? null : n
}

// Auto-classifica pelo nome do arquivo — única fonte de verdade para LEVANTAMENTO/LTC/STC.
// Regra: nome contém "ltc" → LTC; contém "stc" → STC; senão → LEVANTAMENTO.
function classifyFileType(name) {
  const f = String(name ?? '').toLowerCase()
  if (f.includes('ltc')) return 'ltc'
  if (f.includes('stc')) return 'stc'
  return 'levantamento'
}

function transform(p) {
  // When surveys are embedded (getProjects), recompute the levantamento-only
  // count dynamically instead of trusting the denormalized survey_count column,
  // which may be stale for projects with LTC/STC entries from before classification.
  const rawSurveys = Array.isArray(p.surveys) ? p.surveys : null
  const surveyCount = rawSurveys
    ? rawSurveys
        .filter(s => !s.file_type || s.file_type === 'levantamento')
        .reduce((sum, s) => sum + Math.max(parseInt(s.count, 10) || 1, 1), 0)
    : (p.survey_count ?? 0)
  return {
    ...p,
    surveys:              surveyCount,
    surveyCount:          surveyCount,
    rawDate:              p.date ?? p.created_at ?? null,
    date:                 toLocaleDatePT(p.date),
    metragem:             p.project_length != null ? String(p.project_length) : null,
    projectLength:        p.project_length ?? null,
    level:                p.level         ?? null,
    fileName:             p.file_name,
    notes:                p.notes,
    projectUrl:           p.project_url,
    rehabilitationStatus: p.rehabilitation_status,
    statuses:             Array.isArray(p.statuses) ? p.statuses : [],
    images:               (p.project_images ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(img => ({ id: img.id, url: img.url, src: img.url })),
  }
}

export async function getProjects(search = '') {
  const buildQuery = (includeFileType) => {
    const surveysFields = includeFileType ? 'file_type, count' : 'count'
    let query = supabase
      .from('projects')
      .select(`*, project_images(id, url, sort_order, is_main), surveys(${surveysFields})`)
      .order('created_at', { ascending: false })
    if (search) query = query.ilike('code', `%${search}%`)
    return query
  }

  let { data, error } = await buildQuery(true)
  if (error?.code === '42703') {
    // file_type column not yet migrated — fall back without it
    ;({ data, error } = await buildQuery(false))
  }
  if (error) throw new Error(error.message)

  const all      = (data ?? []).flatMap(p => p.surveys ?? [])
  const ltcCount = all.filter(s => s.file_type === 'ltc').length
  const stcCount = all.filter(s => s.file_type === 'stc').length
  const levCount = all.filter(s => !s.file_type || s.file_type === 'levantamento').length
  console.log(`[projects list] surveys total: ${all.length} | ltc: ${ltcCount} | stc: ${stcCount} | levantamentos: ${levCount}`)

  return (data ?? []).map(transform)
}

export async function getProjectById(id) {
  let { data, error } = await supabase
    .from('projects')
    .select('*, project_images(id, url, sort_order, is_main), surveys(id, file, file_type, date, created_at, metering, count, status)')
    .eq('id', id)
    .single()
  if (error?.code === '42703') {
    // file_type column not yet migrated — fall back without it
    ;({ data, error } = await supabase
      .from('projects')
      .select('*, project_images(id, url, sort_order, is_main), surveys(id, file, date, created_at, metering, count, status)')
      .eq('id', id)
      .single())
  }
  if (error) throw new Error(error.message)
  const base = transform(data)
  const rawSurveys = data.surveys ?? []
  const levantamentos = rawSurveys.filter(s => !s.file_type || s.file_type === 'levantamento')
  const levantamentoCount = levantamentos.reduce((sum, s) => sum + Math.max(parseInt(s.count, 10) || 1, 1), 0)
  const sortedSurveys = sortSurveysByDateDesc(rawSurveys).slice(0, 10)
  debugSurveyDates(rawSurveys, `project[${id}]`)
  const latestDate = getLatestSurveyDate(levantamentos)
  return {
    ...base,
    surveyCount: levantamentoCount,
    // Override project.date with the real latest levantamento date
    date: latestDate ? formatDateBR(latestDate) : base.date,
    images: (data.project_images ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(img => ({ id: img.id, url: img.url, src: img.url })),
    surveys: sortedSurveys.map(s => ({ ...s, createdAt: s.created_at })),
  }
}

export async function getProjectDetail(id) {
  return getProjectById(id)
}

export async function createProject(payload) {
  const {
    code, statuses = [], date, surveyCount = 0,
    metragem, fileName, notes, projectUrl,
    projectLength, level, rehabilitationStatus,
  } = payload
  if (!code) throw new Error('code é obrigatório')

  const hasWarning  = Array.isArray(statuses) && statuses.some(s => s.variant === 'warning')
  const rehabStatus = rehabilitationStatus ?? (hasWarning ? 'in_progress' : null)
  const fileType    = classifyFileType(fileName)
  const isLev       = fileType === 'levantamento'
  console.log(`[createProject] arquivo "${fileName ?? ''}" classificado como: ${fileType.toUpperCase()}`)

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      code,
      statuses:              statuses ?? [],
      date:                  date ? new Date(date).toISOString() : new Date().toISOString(),
      survey_count:          isLev ? (Number(surveyCount) || 0) : 0,
      metragem:              metragem    ?? null,
      file_name:             fileName    ?? null,
      notes:                 notes       ?? null,
      project_url:           projectUrl  ?? null,
      project_length:        projectLength != null ? parseFloat(projectLength) : null,
      level:                 level         != null ? parseInt(level, 10)       : null,
      rehabilitation_status: rehabStatus,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)

  // Auto-create first survey entry — classificado pelo nome do arquivo (LTC/STC nunca contam como levantamento)
  const surveyData = {
    project_id: project.id,
    local:      code,
    file:       fileName ?? '',
    status:     (Array.isArray(statuses) && statuses[0]?.variant) ? statuses[0].variant : 'success',
    date:       date ? new Date(date).toISOString() : new Date().toISOString(),
    count:      isLev ? (Number(surveyCount) || 1) : 0,
    metering:   isLev ? (metragem ?? (projectLength != null ? String(projectLength) : null)) : null,
    file_type:  fileType,
  }
  let { error: surveyErr } = await supabase.from('surveys').insert(surveyData)
  if (surveyErr?.code === '42703') {
    delete surveyData.file_type
    ;({ error: surveyErr } = await supabase.from('surveys').insert(surveyData))
  }
  if (surveyErr) console.error('[createProject] survey insert error:', surveyErr.message)

  logAction({
    action: 'create_project',
    entityType: 'project',
    entityId: project.id,
    entityName: project.code,
    projectId: project.id,
    description: `Criou o projeto ${project.code}`,
    newValue: { code: project.code },
  })

  return transform(project)
}

export async function updateProject(id, payload, { registerSurvey = false } = {}) {
  const {
    code, statuses, date, surveyCount, metragem,
    fileName, notes, projectUrl, projectLength, level, rehabilitationStatus,
  } = payload

  const updates = {}
  if (code             !== undefined) updates.code                 = code
  if (statuses         !== undefined) updates.statuses             = statuses
  if (date             !== undefined) updates.date                 = new Date(date).toISOString()
  if (surveyCount      !== undefined) updates.survey_count         = Number(surveyCount)
  if (metragem         !== undefined) updates.metragem             = metragem
  if (fileName         !== undefined) updates.file_name            = fileName
  if (notes            !== undefined) updates.notes                = notes
  if (projectUrl       !== undefined) updates.project_url          = projectUrl
  if (projectLength    !== undefined) updates.project_length       = nullableFloat(projectLength)
  if (level            !== undefined) updates.level                = level != null ? parseInt(level, 10) : null
  if (rehabilitationStatus !== undefined) updates.rehabilitation_status = rehabilitationStatus ?? null

  const { data: updated, error } = await supabase
    .from('projects').update(updates).eq('id', id).select().single()
  if (error) throw new Error(error.message)

  if (registerSurvey) {
    const surveyStatus = Array.isArray(updated.statuses) && updated.statuses[0]?.variant
      ? updated.statuses[0].variant : 'success'
    const fileType = classifyFileType(updated.file_name)
    const isLev    = fileType === 'levantamento'
    console.log(`[updateProject] arquivo "${updated.file_name ?? ''}" classificado como: ${fileType.toUpperCase()}`)

    const surveyData = {
      project_id: id,
      local:      updated.code,
      file:       updated.file_name ?? '',
      status:     surveyStatus,
      date:       updated.date ?? new Date().toISOString(),
      count:      isLev ? (updated.survey_count || 1) : 0,
      metering:   isLev ? (updated.project_length ? String(updated.project_length) : null) : null,
      file_type:  fileType,
    }
    let { error: surveyErr } = await supabase.from('surveys').insert(surveyData)
    if (surveyErr?.code === '42703') {
      delete surveyData.file_type
      ;({ error: surveyErr } = await supabase.from('surveys').insert(surveyData))
    }
    if (surveyErr) console.error('[updateProject] survey insert error:', surveyErr.message)

    // Increment survey count — apenas para levantamentos reais
    if (isLev) {
      await supabase
        .from('projects')
        .update({ survey_count: (updated.survey_count ?? 0) + 1 })
        .eq('id', id)
    }
  }

  // Audit: general edit
  logAction({
    action: 'edit_project',
    entityType: 'project',
    entityId: id,
    entityName: updated.code,
    projectId: id,
    description: `Editou o projeto ${updated.code}`,
    newValue: updates,
  })

  // Audit: status change
  if (statuses !== undefined) {
    logAction({
      action: 'change_status',
      entityType: 'project',
      entityId: id,
      entityName: updated.code,
      projectId: id,
      description: `Alterou status do projeto ${updated.code}`,
      newValue: { statuses },
    })
  }

  // Audit: rehab status change
  if (rehabilitationStatus !== undefined) {
    logAction({
      action: 'change_rehab',
      entityType: 'project',
      entityId: id,
      entityName: updated.code,
      projectId: id,
      description: `Alterou reabilitação do projeto ${updated.code}`,
      newValue: { rehabilitation_status: rehabilitationStatus },
    })
  }

  return transform(updated)
}

export async function deleteProject(id) {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function deleteProjectCascade(projectId) {
  console.log('[delete] Starting cascade delete for project', projectId)

  // Fetch project code for audit log before deletion
  const { data: _proj } = await supabase
    .from('projects').select('code').eq('id', projectId).maybeSingle()
  const _code = _proj?.code ?? String(projectId)

  // Fetch image records first so we can clean up Storage
  const { data: images } = await supabase
    .from('project_images').select('url').eq('project_id', projectId)

  if (images?.length) {
    const paths = images
      .map(img => img.url?.split('/project-images/')[1])
      .filter(Boolean)
      .map(p => decodeURIComponent(p))
    if (paths.length) {
      const { error: storageErr } = await supabase.storage.from('project-images').remove(paths)
      if (storageErr) console.warn('[delete] storage files:', storageErr.message)
      else console.log('[delete] Deleted storage files:', paths.length)
    }
  }

  // Delete project files (LTC/STC)
  try {
    await deleteAllProjectFiles(projectId)
    console.log('[delete] Deleted project_files')
  } catch (err) {
    console.warn('[delete] project_files:', err.message)
  }

  // Delete surveys
  {
    const { error } = await supabase.from('surveys').delete().eq('project_id', projectId)
    if (error) console.warn('[delete] surveys:', error.message)
    else console.log('[delete] Deleted surveys')
  }

  // Delete project_images rows
  {
    const { error } = await supabase.from('project_images').delete().eq('project_id', projectId)
    if (error) console.warn('[delete] project_images:', error.message)
    else console.log('[delete] Deleted project_images')
  }

  // Delete monitoring
  {
    const { error } = await supabase.from('monitoring').delete().eq('project_id', projectId)
    if (error) console.warn('[delete] monitoring:', error.message)
    else console.log('[delete] Deleted monitoring')
  }

  // Delete monitoring_projects (junction table - may not exist)
  {
    const { error } = await supabase.from('monitoring_projects').delete().eq('project_id', projectId)
    if (error) console.warn('[delete] monitoring_projects:', error.message)
    else console.log('[delete] Deleted monitoring_projects')
  }

  // Optional tables (status_history)
  {
    const { error } = await supabase.from('status_history').delete().eq('project_id', projectId)
    if (error) console.warn('[delete] status_history:', error.message)
    else console.log('[delete] Deleted status_history')
  }

  // Delete the project itself
  const { error } = await supabase.from('projects').delete().eq('id', projectId)
  if (error) {
    console.error('[delete] Failed to delete project:', error.message, error)
    throw new Error(error.message)
  }
  console.log('[delete] Project deleted successfully')

  // Audit log after deletion (audit_logs preserved — no FK to projects)
  logAction({
    action: 'delete_project',
    entityType: 'project',
    entityId: projectId,
    entityName: _code,
    projectId: projectId,
    description: `Excluiu o projeto ${_code}`,
  })

  return { success: true }
}

export async function uploadProjectImage(projectId, file) {
  const ext  = file.name.split('.').pop()
  const path = `${projectId}/${Date.now()}.${ext}`

  const { error: uploadErr } = await supabase.storage.from('project-images').upload(path, file)
  if (uploadErr) throw new Error(uploadErr.message)

  const { data: { publicUrl } } = supabase.storage.from('project-images').getPublicUrl(path)

  const { data: existing } = await supabase
    .from('project_images').select('sort_order').eq('project_id', projectId)
    .order('sort_order', { ascending: false }).limit(1)
  const nextOrder = existing?.[0]?.sort_order != null ? existing[0].sort_order + 1 : 0

  const { data: image, error: dbErr } = await supabase
    .from('project_images')
    .insert({ project_id: projectId, url: publicUrl, sort_order: nextOrder })
    .select().single()
  if (dbErr) throw new Error(dbErr.message)

  logAction({
    action: 'add_image',
    entityType: 'image',
    entityId: image.id,
    entityName: path,
    projectId: projectId,
    description: `Adicionou imagem ao projeto`,
    newValue: { url: image.url },
  })

  return { id: image.id, url: image.url, src: image.url }
}

export async function deleteProjectImage(projectId, imageId) {
  const { data: img } = await supabase
    .from('project_images').select('url').eq('id', imageId).single()
  if (img?.url) {
    const storagePath = img.url.split('/project-images/')[1]
    if (storagePath) await supabase.storage.from('project-images').remove([decodeURIComponent(storagePath)])
  }
  const { error } = await supabase.from('project_images').delete().eq('id', imageId)
  if (error) throw new Error(error.message)

  logAction({
    action: 'remove_image',
    entityType: 'image',
    entityId: imageId,
    projectId: projectId,
    description: `Removeu imagem do projeto`,
  })
}

export async function getProjectSurveys(projectId) {
  const { data, error } = await supabase
    .from('surveys')
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw new Error(error.message)
  // Client-side sort guarantees correct order regardless of server behavior
  return sortSurveysByDateDesc(data ?? []).map(s => ({ ...s, createdAt: s.created_at }))
}

export async function addSurveyToProject(projectId, payload) {
  const { file, date, count = 1, metering, status, observations } = payload
  const { data: project } = await supabase
    .from('projects').select('code, statuses, file_name').eq('id', projectId).single()
  // Classificação automática pelo nome do arquivo — ignora qualquer tipo manual
  const candidateName = file ?? project?.file_name ?? ''
  const fileType = classifyFileType(candidateName)
  const isLev    = fileType === 'levantamento'
  console.log(`[addSurveyToProject] arquivo "${candidateName}" classificado como: ${fileType.toUpperCase()}`)
  const surveyStatus = status
    ?? (Array.isArray(project?.statuses) && project.statuses[0]?.variant ? project.statuses[0].variant : 'success')

  const surveyData = {
    project_id: projectId,
    local:      project?.code ?? '',
    file:       file ?? (isLev ? project?.file_name ?? '' : ''),
    status:     surveyStatus,
    date:       date ? new Date(date).toISOString() : new Date().toISOString(),
    // LTC/STC do not carry count or metering — they are not production entries
    count:      isLev ? (parseInt(count) || 1) : 0,
    metering:   isLev ? (metering ?? null) : null,
    file_type:  fileType,
  }
  if (isLev && observations) surveyData.observations = observations

  let { data, error } = await supabase.from('surveys').insert(surveyData).select().single()

  // Graceful fallback if optional columns don't exist yet
  if (error?.code === '42703') {
    if ('observations' in surveyData) delete surveyData.observations
    if ('file_type' in surveyData) delete surveyData.file_type
    ;({ data, error } = await supabase.from('surveys').insert(surveyData).select().single())
  }
  if (error) throw new Error(error.message)

  logAction({
    action: 'create_survey',
    entityType: 'survey',
    entityId: data.id,
    entityName: file ?? project?.file_name ?? String(projectId),
    projectId: projectId,
    description: `Adicionou ${fileType === 'levantamento' ? 'levantamento' : fileType.toUpperCase()} ao projeto ${project?.code ?? projectId}`,
    newValue: { file, fileType, count: isLev ? count : 0, metering: isLev ? metering : null },
  })

  // Only increment survey_count for real levantamentos
  if (isLev) {
    const { data: p } = await supabase.from('projects').select('survey_count').eq('id', projectId).single()
    await supabase.from('projects').update({ survey_count: (p?.survey_count ?? 0) + (parseInt(count) || 1) }).eq('id', projectId)
  }

  return { ...data, createdAt: data.created_at }
}