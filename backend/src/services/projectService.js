import prisma from '../lib/prisma.js'

export async function getAll({ search } = {}) {
  const where = search ? { code: { contains: search } } : {}
  return prisma.project.findMany({
    where,
    include: { images: { orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getById(id) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      images:  { orderBy: { order: 'asc' } },
      surveys: { orderBy: { date: 'desc' }, take: 10 },
    },
  })
  if (!project) throw Object.assign(new Error('Projeto não encontrado'), { status: 404 })
  return project
}

export async function create(data, userId) {
  const { code, statuses = [], date, surveyCount = 0, metragem, fileName, notes, projectUrl, projectLength, level, rehabilitationStatus } = data
  if (!code) throw Object.assign(new Error('code é obrigatório'), { status: 400 })

  const hasWarning = Array.isArray(statuses) && statuses.some(s => s.variant === 'warning')
  const rehabStatus = rehabilitationStatus ?? (hasWarning ? 'in_progress' : null)

  const project = await prisma.project.create({
    data: {
      code,
      statuses,
      date:                 new Date(date || Date.now()),
      surveyCount:          Number(surveyCount) || 0,
      metragem:             metragem             ?? null,
      fileName:             fileName             ?? null,
      notes:                notes                ?? null,
      projectUrl:           projectUrl           ?? null,
      projectLength:        projectLength != null ? parseFloat(projectLength) : null,
      level:                level         != null ? parseInt(level, 10)       : null,
      rehabilitationStatus: rehabStatus,
      userId:               userId               ?? null,
    },
    include: { images: true },
  })

  // Record the initial upload as the first survey entry
  await prisma.survey.create({
    data: {
      local:     code,
      file:      fileName ?? '',
      status:    Array.isArray(statuses) && statuses[0]?.variant ? statuses[0].variant : 'success',
      date:      new Date(date || Date.now()),
      count:     Number(surveyCount) || 1,
      metering:  metragem ?? null,
      projectId: project.id,
    },
  })

  return project
}

function nullableFloat(v) {
  if (v == null || v === '') return null
  const n = parseFloat(v)
  return isNaN(n) ? null : n
}

export async function update(id, data) {
  const existing = await getById(id)
  const { code, statuses, date, surveyCount, metragem, fileName, notes, projectUrl, projectLength, level, rehabilitationStatus } = data

  // Auto-default rehabilitationStatus when warning status is present
  let resolvedRehabStatus = rehabilitationStatus
  if (rehabilitationStatus === undefined && statuses !== undefined) {
    const hasWarning = Array.isArray(statuses) && statuses.some(s => s.variant === 'warning')
    if (hasWarning && !existing.rehabilitationStatus) {
      resolvedRehabStatus = 'in_progress'
    }
  }

  const updated = await prisma.project.update({
    where: { id },
    data: {
      ...(code                   !== undefined && { code }),
      ...(statuses               !== undefined && { statuses }),
      ...(date                   !== undefined && { date: new Date(date) }),
      ...(surveyCount            !== undefined && { surveyCount: Number(surveyCount) }),
      ...(metragem               !== undefined && { metragem }),
      ...(fileName               !== undefined && { fileName }),
      ...(notes                  !== undefined && { notes }),
      ...(projectUrl             !== undefined && { projectUrl }),
      ...(projectLength          !== undefined && { projectLength: nullableFloat(projectLength) }),
      ...(level                  !== undefined && { level: level != null ? parseInt(level, 10) : null }),
      ...(resolvedRehabStatus    !== undefined && { rehabilitationStatus: resolvedRehabStatus ?? null }),
    },
    include: { images: true },
  })

  // Auto-record a survey entry when key survey fields change
  const dateChanged = date !== undefined && (() => {
    const n = new Date(date); const o = existing.date ? new Date(existing.date) : null
    return !o || n.toDateString() !== o.toDateString()
  })()
  const fileChanged     = fileName      !== undefined && fileName !== existing.fileName
  const meteringChanged = projectLength !== undefined && nullableFloat(projectLength) !== (existing.projectLength ?? null)
  const countChanged    = surveyCount   !== undefined && Number(surveyCount) !== existing.surveyCount
  const newVariants     = (statuses ?? []).map(s => s.variant).sort().join(',')
  const oldVariants     = (existing.statuses ?? []).map(s => s.variant).sort().join(',')
  const statusChanged   = statuses !== undefined && newVariants !== oldVariants

  if (dateChanged || fileChanged || meteringChanged || countChanged || statusChanged) {
    const surveyStatus = Array.isArray(updated.statuses) && updated.statuses[0]?.variant
      ? updated.statuses[0].variant
      : 'success'
    await prisma.survey.create({
      data: {
        local:     updated.code,
        file:      updated.fileName ?? '',
        status:    surveyStatus,
        date:      updated.date ?? new Date(),
        count:     updated.surveyCount || 1,
        metering:  updated.projectLength ?? null,
        projectId: id,
      },
    })
  }

  return updated
}

export async function remove(id) {
  await getById(id)
  return prisma.project.delete({ where: { id } })
}

export async function addImage(projectId, { url, order = 0 }) {
  return prisma.projectImage.create({
    data: { url, order, projectId },
  })
}

export async function removeImage(imageId) {
  const image = await prisma.projectImage.findUnique({ where: { id: imageId } })
  if (!image) throw Object.assign(new Error('Imagem não encontrada'), { status: 404 })
  return prisma.projectImage.delete({ where: { id: imageId } })
}
