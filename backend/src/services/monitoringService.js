import prisma from '../lib/prisma.js'

function daysUntilNext(lastSurvey, frequencyDays) {
  const next  = new Date(lastSurvey)
  next.setDate(next.getDate() + frequencyDays)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((next.getTime() - today.getTime()) / 86_400_000)
}

function withDays(row) {
  const days = row.lastSurvey != null
    ? daysUntilNext(row.lastSurvey, row.frequencyDays)
    : null
  return { ...row, daysUntilNext: days }
}

export async function getAll() {
  const rows = await prisma.monitoring.findMany({ orderBy: { area: 'asc' } })
  return rows.map(withDays)
}

export async function getById(id) {
  const row = await prisma.monitoring.findUnique({ where: { id } })
  if (!row) throw Object.assign(new Error('Monitoramento não encontrado'), { status: 404 })
  return withDays(row)
}

export async function create(data, userId) {
  const { area, projectName, frequencyDays, lastSurvey, surveyCount = 0, projectId } = data
  if (!area || !projectName || !frequencyDays) {
    throw Object.assign(
      new Error('area, projectName e frequencyDays são obrigatórios'),
      { status: 400 },
    )
  }
  const row = await prisma.monitoring.create({
    data: {
      area,
      projectName,
      frequencyDays: parseInt(frequencyDays),
      lastSurvey:    lastSurvey ? new Date(lastSurvey) : null,
      surveyCount:   parseInt(surveyCount) || 0,
      userId:        userId ?? null,
      ...(projectId && { projectId: parseInt(projectId) }),
    },
  })
  return withDays(row)
}

export async function updateMonitoringFromProject(project) {
  if (!project.fileName) return
  const allRows = await prisma.monitoring.findMany()
  const scanner = project.fileName.toLowerCase()
  const matches = allRows.filter(row =>
    scanner.includes(row.projectName.trim().toLowerCase())
  )
  for (const row of matches) {
    await prisma.monitoring.update({
      where: { id: row.id },
      data: {
        lastSurvey:  project.date ? new Date(project.date) : project.createdAt,
        surveyCount: { increment: 1 },
      },
    })
  }
}

export async function update(id, data) {
  await getById(id)
  const { area, projectName, frequencyDays, lastSurvey, surveyCount } = data
  const row = await prisma.monitoring.update({
    where: { id },
    data: {
      ...(area          !== undefined && { area }),
      ...(projectName   !== undefined && { projectName }),
      ...(frequencyDays !== undefined && { frequencyDays: parseInt(frequencyDays) }),
      ...(lastSurvey    !== undefined && { lastSurvey: lastSurvey ? new Date(lastSurvey) : null }),
      ...(surveyCount   !== undefined && { surveyCount: parseInt(surveyCount) }),
    },
  })
  return withDays(row)
}

export async function remove(id) {
  await getById(id)
  return prisma.monitoring.delete({ where: { id } })
}
