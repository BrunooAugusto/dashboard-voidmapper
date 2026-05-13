import prisma from '../lib/prisma.js'

export async function createForProject(projectId, data) {
  const project = await prisma.project.findUnique({
    where:  { id: projectId },
    select: { id: true, code: true, statuses: true, fileName: true },
  })
  if (!project) throw Object.assign(new Error('Projeto não encontrado'), { status: 404 })

  const { file, date, count = 1, metering, status } = data

  const surveyStatus =
    status ??
    (Array.isArray(project.statuses) && project.statuses[0]?.variant
      ? project.statuses[0].variant
      : 'success')

  const survey = await prisma.survey.create({
    data: {
      local:     project.code,
      file:      file ?? project.fileName ?? '',
      status:    surveyStatus,
      date:      date ? new Date(date) : new Date(),
      count:     parseInt(count) || 1,
      metering:  metering ?? null,
      projectId,
    },
  })

  // Reflect the new upload in the project's total survey count
  await prisma.project.update({
    where: { id: projectId },
    data:  { surveyCount: { increment: 1 } },
  })

  return survey
}

export async function getForProject(projectId) {
  return prisma.survey.findMany({
    where:   { projectId },
    orderBy: { createdAt: 'desc' },
  })
}
