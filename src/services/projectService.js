import { supabase } from '../lib/supabase.js'

function toLocaleDatePT(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function nullableFloat(v) {
  if (v == null || v === '') return null
  const n = parseFloat(v)
  return isNaN(n) ? null : n
}

function transform(p) {
  return {
    ...p,
    // camelCase aliases so UI code doesn't break
    surveys:              p.survey_count  ?? 0,
    surveyCount:          p.survey_count  ?? 0,
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
  let query = supabase
    .from('projects')
    .select('*, project_images(id, url, sort_order, is_main)')
    .order('created_at', { ascending: false })
  if (search) query = query.ilike('code', `%${search}%`)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map(transform)
}

export async function getProjectById(id) {
  const { data, error } = await supabase
    .from('projects')
    .select('*, project_images(id, url, sort_order, is_main), surveys(id, file, date, created_at, metering, count, status)')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  const base = transform(data)
  return {
    ...base,
    images: (data.project_images ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(img => ({ id: img.id, url: img.url, src: img.url })),
    surveys: (data.surveys ?? [])
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10)
      .map(s => ({ ...s, createdAt: s.created_at })),
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

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      code,
      statuses:              statuses ?? [],
      date:                  date ? new Date(date).toISOString() : new Date().toISOString(),
      survey_count:          Number(surveyCount) || 0,
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

  // Auto-create first survey entry
  await supabase.from('surveys').insert({
    project_id: project.id,
    local:      code,
    file:       fileName ?? '',
    status:     (Array.isArray(statuses) && statuses[0]?.variant) ? statuses[0].variant : 'success',
    date:       date ? new Date(date).toISOString() : new Date().toISOString(),
    count:      Number(surveyCount) || 1,
    metering:   metragem ?? (projectLength != null ? String(projectLength) : null),
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
    await supabase.from('surveys').insert({
      project_id: id,
      local:      updated.code,
      file:       updated.file_name ?? '',
      status:     surveyStatus,
      date:       updated.date ?? new Date().toISOString(),
      count:      updated.survey_count || 1,
      metering:   updated.project_length ? String(updated.project_length) : null,
    })
    // Increment survey count
    await supabase
      .from('projects')
      .update({ survey_count: (updated.survey_count ?? 0) + 1 })
      .eq('id', id)
  }

  return transform(updated)
}

export async function deleteProject(id) {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw new Error(error.message)
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
}

export async function getProjectSurveys(projectId) {
  const { data, error } = await supabase
    .from('surveys')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(10)
  if (error) throw new Error(error.message)
  return (data ?? []).map(s => ({ ...s, createdAt: s.created_at }))
}

export async function addSurveyToProject(projectId, payload) {
  const { file, date, count = 1, metering, status } = payload
  const { data: project } = await supabase
    .from('projects').select('code, statuses, file_name').eq('id', projectId).single()
  const surveyStatus = status
    ?? (Array.isArray(project?.statuses) && project.statuses[0]?.variant ? project.statuses[0].variant : 'success')

  const { data, error } = await supabase.from('surveys').insert({
    project_id: projectId,
    local:      project?.code ?? '',
    file:       file ?? project?.file_name ?? '',
    status:     surveyStatus,
    date:       date ? new Date(date).toISOString() : new Date().toISOString(),
    count:      parseInt(count) || 1,
    metering:   metering ?? null,
  }).select().single()
  if (error) throw new Error(error.message)

  // Increment survey count
  const { data: p } = await supabase.from('projects').select('survey_count').eq('id', projectId).single()
  await supabase.from('projects').update({ survey_count: (p?.survey_count ?? 0) + 1 }).eq('id', projectId)

  return { ...data, createdAt: data.created_at }
}
