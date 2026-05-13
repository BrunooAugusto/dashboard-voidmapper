import { getMetrics, getRecentSurveys, getRehabilitatedProjects } from './dashboardService.js'
import { getAll as getAllMonitoring } from './monitoringService.js'
import prisma from '../lib/prisma.js'

export async function getWeeklyReportData(userId) {
  const [metrics, surveys, rehab, monitoring] = await Promise.all([
    getMetrics(userId),
    getRecentSurveys(userId),
    getRehabilitatedProjects(userId),
    getAllMonitoring(userId),
  ])

  // Fetch deformation projects (statuses contains danger variant)
  const projectWhere = userId !== undefined ? { userId } : {}
  const allProjects  = await prisma.project.findMany({
    where:   projectWhere,
    select:  { id: true, code: true, statuses: true, date: true, fileName: true, notes: true, surveyCount: true, images: { select: { url: true } } },
    orderBy: { updatedAt: 'desc' },
  })

  const deformationProjects = allProjects.filter(p =>
    Array.isArray(p.statuses) && p.statuses.some(s => s.variant === 'danger'),
  ).map(p => ({
    id:         p.id,
    code:       p.code,
    fileName:   p.fileName,
    notes:      p.notes,
    surveys:    p.surveyCount,
    date:       p.date ? new Date(p.date).toLocaleDateString('pt-BR') : '—',
    mainImage:  p.images?.[0]?.url ?? null,
  }))

  return { metrics, surveys, rehab, monitoring, deformationProjects }
}
