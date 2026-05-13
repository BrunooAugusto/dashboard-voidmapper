import { getMetrics, getRecentSurveys, getRehabilitatedProjects } from './dashboardService.js'
import { getAll as getAllMonitoring } from './monitoringService.js'
import prisma from '../lib/prisma.js'

export async function getWeeklyReportData(start, end) {
  const [metrics, surveys, rehab, monitoring] = await Promise.all([
    getMetrics(),
    getRecentSurveys(start, end),
    getRehabilitatedProjects(),
    getAllMonitoring(),
  ])

  const allProjects = await prisma.project.findMany({
    select: {
      id:         true,
      code:       true,
      statuses:   true,
      date:       true,
      fileName:   true,
      notes:      true,
      surveyCount: true,
      images:     { select: { url: true }, take: 2 },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const deformationProjects = allProjects.filter(p =>
    Array.isArray(p.statuses) && p.statuses.some(s => s.variant === 'danger'),
  ).map(p => ({
    id:       p.id,
    code:     p.code,
    fileName: p.fileName,
    notes:    p.notes,
    surveys:  p.surveyCount,
    date:     p.date ? new Date(p.date).toLocaleDateString('pt-BR') : '—',
    images:   (p.images ?? []).map(img => img.url),
  }))

  const errorProjects = allProjects.filter(p =>
    Array.isArray(p.statuses) && p.statuses.some(s => s.variant === 'info'),
  ).map(p => ({
    id:       p.id,
    code:     p.code,
    fileName: p.fileName,
    notes:    p.notes,
    surveys:  p.surveyCount,
    date:     p.date ? new Date(p.date).toLocaleDateString('pt-BR') : '—',
    images:   (p.images ?? []).map(img => img.url),
  }))

  return { metrics, surveys, rehab, monitoring, deformationProjects, errorProjects }
}
