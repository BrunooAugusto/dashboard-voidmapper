import prisma from '../lib/prisma.js'

function daysUntilNext(lastSurvey, frequencyDays) {
  const next  = new Date(lastSurvey)
  next.setDate(next.getDate() + frequencyDays)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((next.getTime() - today.getTime()) / 86_400_000)
}

function withDays(row) {
  return { ...row, daysUntilNext: daysUntilNext(row.lastSurvey, row.frequencyDays) }
}

export async function getAll(userId) {
  const where = userId !== undefined ? { userId } : {}
  const rows = await prisma.monitoring.findMany({ where, orderBy: { area: 'asc' } })
  return rows.map(withDays)
}

export async function getById(id, userId) {
  const row = await prisma.monitoring.findUnique({ where: { id } })
  if (!row) throw Object.assign(new Error('Monitoramento não encontrado'), { status: 404 })
  if (userId !== undefined && row.userId !== null && row.userId !== userId) {
    throw Object.assign(new Error('Monitoramento não encontrado'), { status: 404 })
  }
  return withDays(row)
}

export async function create(data, userId) {
  const { area, projectName, frequencyDays, lastSurvey, surveyCount = 0, projectId } = data
  if (!area || !projectName || !frequencyDays || !lastSurvey) {
    throw Object.assign(
      new Error('area, projectName, frequencyDays e lastSurvey são obrigatórios'),
      { status: 400 },
    )
  }
  const row = await prisma.monitoring.create({
    data: {
      area,
      projectName,
      frequencyDays: parseInt(frequencyDays),
      lastSurvey:    new Date(lastSurvey),
      surveyCount:   parseInt(surveyCount) || 0,
      userId:        userId ?? null,
      ...(projectId && { projectId: parseInt(projectId) }),
    },
  })
  return withDays(row)
}

export async function update(id, data, userId) {
  await getById(id, userId)
  const { area, projectName, frequencyDays, lastSurvey, surveyCount } = data
  const row = await prisma.monitoring.update({
    where: { id },
    data: {
      ...(area          !== undefined && { area }),
      ...(projectName   !== undefined && { projectName }),
      ...(frequencyDays !== undefined && { frequencyDays: parseInt(frequencyDays) }),
      ...(lastSurvey    !== undefined && { lastSurvey: new Date(lastSurvey) }),
      ...(surveyCount   !== undefined && { surveyCount: parseInt(surveyCount) }),
    },
  })
  return withDays(row)
}

export async function remove(id, userId) {
  await getById(id, userId)
  return prisma.monitoring.delete({ where: { id } })
}
