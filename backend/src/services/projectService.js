import prisma from '../lib/prisma.js'

export async function getAll({ search, userId } = {}) {
  const where = {
    ...(userId !== undefined && { userId }),
    ...(search && { code: { contains: search } }),  // mode:'insensitive' is PostgreSQL-only
  }
  return prisma.project.findMany({
    where,
    include: { images: { orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getById(id, userId) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      images:  { orderBy: { order: 'asc' } },
      surveys: { orderBy: { date: 'desc' }, take: 10 },
    },
  })
  if (!project) throw Object.assign(new Error('Projeto não encontrado'), { status: 404 })
  if (userId !== undefined && project.userId !== null && project.userId !== userId) {
    throw Object.assign(new Error('Projeto não encontrado'), { status: 404 })
  }
  return project
}

export async function create(data, userId) {
  const { code, statuses = [], date, surveyCount = 0, metragem, fileName, notes, projectUrl, projectLength } = data
  if (!code) throw Object.assign(new Error('code é obrigatório'), { status: 400 })
  return prisma.project.create({
    data: {
      code,
      statuses,
      date:          new Date(date || Date.now()),
      surveyCount:   Number(surveyCount) || 0,
      metragem:      metragem      ?? null,
      fileName:      fileName      ?? null,
      notes:         notes         ?? null,
      projectUrl:    projectUrl    ?? null,
      projectLength: projectLength != null ? parseFloat(projectLength) : null,
      userId:        userId        ?? null,
    },
    include: { images: true },
  })
}

export async function update(id, data, userId) {
  await getById(id, userId)
  const { code, statuses, date, surveyCount, metragem, fileName, notes, projectUrl, projectLength } = data
  return prisma.project.update({
    where: { id },
    data: {
      ...(code          !== undefined && { code }),
      ...(statuses      !== undefined && { statuses }),
      ...(date          !== undefined && { date: new Date(date) }),
      ...(surveyCount   !== undefined && { surveyCount: Number(surveyCount) }),
      ...(metragem      !== undefined && { metragem }),
      ...(fileName      !== undefined && { fileName }),
      ...(notes         !== undefined && { notes }),
      ...(projectUrl    !== undefined && { projectUrl }),
      ...(projectLength !== undefined && { projectLength: parseFloat(projectLength) }),
    },
    include: { images: true },
  })
}

export async function remove(id, userId) {
  await getById(id, userId)
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
