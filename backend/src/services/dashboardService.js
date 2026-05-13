import prisma from '../lib/prisma.js'

export async function getMetrics(userId) {
  const projectWhere = userId !== undefined ? { userId } : {}
  const surveyWhere  = userId !== undefined ? { project: { userId } } : {}

  const [projects, totalSurveys] = await Promise.all([
    prisma.project.findMany({ where: projectWhere, select: { statuses: true } }),
    prisma.survey.count({ where: surveyWhere }),
  ])

  const total          = projects.length
  const deformations   = projects.filter(p => Array.isArray(p.statuses) && p.statuses.some(s => s.variant === 'danger')).length
  const rehabilitating = projects.filter(p => Array.isArray(p.statuses) && p.statuses.some(s => s.variant === 'warning')).length
  const errors         = projects.filter(p => Array.isArray(p.statuses) && p.statuses.some(s => s.variant === 'info')).length

  return { totalProjects: total, deformations, rehabilitating, errors, totalSurveys }
}

export async function getRecentSurveys(userId) {
  const since = new Date()
  since.setDate(since.getDate() - 7)
  since.setHours(0, 0, 0, 0)

  const where = {
    createdAt: { gte: since },
    ...(userId !== undefined && { userId }),
  }

  const projects = await prisma.project.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return projects.map(p => {
    const statuses = Array.isArray(p.statuses) ? p.statuses : []
    return {
      id:       p.id,
      local:    p.code,
      file:     p.fileName ?? '—',
      status:   { variant: statuses[0]?.variant ?? 'success' },
      date:     p.createdAt.toLocaleDateString('pt-BR'),
      surveys:  p.surveyCount,
      metering: p.projectLength != null ? `${p.projectLength} m` : '—',
    }
  })
}

// ── Analytics helpers ──────────────────────────────────────────────────────────

function aggEntry(label) {
  return { label, surveys: 0, approved: 0, deformations: 0, rehabilitating: 0, errors: 0 }
}

function tally(entry, status) {
  entry.surveys++
  if      (status === 'success') entry.approved++
  else if (status === 'danger')  entry.deformations++
  else if (status === 'warning') entry.rehabilitating++
  else if (status === 'info')    entry.errors++
}

const DAY_LABELS    = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const ORDERED_DAYS  = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const MONTH_LABELS  = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function aggregateByDay(surveys) {
  const map = Object.fromEntries(ORDERED_DAYS.map(d => [d, aggEntry(d)]))
  for (const s of surveys) {
    const label = DAY_LABELS[new Date(s.date).getDay()]
    tally(map[label], s.status)
  }
  return ORDERED_DAYS.map(d => map[d])
}

function aggregateByWeek(surveys) {
  const weeks = [aggEntry('Sem 1'), aggEntry('Sem 2'), aggEntry('Sem 3'), aggEntry('Sem 4')]
  for (const s of surveys) {
    const day = new Date(s.date).getDate()
    const idx = Math.min(Math.floor((day - 1) / 7), 3)
    tally(weeks[idx], s.status)
  }
  return weeks
}

function aggregateByMonth(surveys) {
  const map = Object.fromEntries(MONTH_LABELS.map((m, i) => [i, aggEntry(m)]))
  for (const s of surveys) {
    const month = new Date(s.date).getMonth()
    tally(map[month], s.status)
  }
  return MONTH_LABELS.map((_, i) => map[i])
}

export async function getAnalytics(period = 'weekly', userId, month) {
  const now   = new Date()
  let since   = new Date()
  let until   = null

  if (period === 'weekly') {
    since = new Date(now)
    since.setDate(now.getDate() - 6)
    since.setHours(0, 0, 0, 0)
  } else if (period === 'monthly') {
    const targetMonth = month !== undefined ? month : now.getMonth()
    since = new Date(now.getFullYear(), targetMonth, 1, 0, 0, 0, 0)
    until = new Date(now.getFullYear(), targetMonth + 1, 0, 23, 59, 59, 999)
  } else {
    since = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
  }

  const userFilter = userId !== undefined ? { project: { userId } } : {}
  const dateFilter = until
    ? { date: { gte: since, lte: until } }
    : { date: { gte: since } }

  const surveys = await prisma.survey.findMany({
    where:   { ...dateFilter, ...userFilter },
    orderBy: { date: 'asc' },
    select:  { date: true, status: true },
  })

  let chartData
  if (period === 'weekly')       chartData = aggregateByDay(surveys)
  else if (period === 'monthly') chartData = aggregateByWeek(surveys)
  else                           chartData = aggregateByMonth(surveys)

  return { period, chartData }
}

export async function getRehabilitatedProjects(userId) {
  const where = userId !== undefined ? { userId } : {}
  const projects = await prisma.project.findMany({
    where,
    select:  { id: true, code: true, updatedAt: true, statuses: true },
    orderBy: { updatedAt: 'desc' },
    take:    10,
  })
  const rehab = projects.filter(p =>
    Array.isArray(p.statuses) && p.statuses.some(s => s.variant === 'warning'),
  )
  return rehab.map(p => ({
    id:   p.id,
    code: p.code,
    date: p.updatedAt.toLocaleDateString('pt-BR'),
  }))
}
