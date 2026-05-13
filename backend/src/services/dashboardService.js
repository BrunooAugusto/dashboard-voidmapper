import prisma from '../lib/prisma.js'

export async function getMetrics() {
  const [projects, totalSurveys] = await Promise.all([
    prisma.project.findMany({ select: { statuses: true, rehabilitationStatus: true } }),
    prisma.survey.count(),
  ])

  const total        = projects.length
  const deformations = projects.filter(p =>
    Array.isArray(p.statuses) && p.statuses.some(s => s.variant === 'danger')
  ).length

  const rehabilitating = projects.filter(p =>
    Array.isArray(p.statuses) &&
    p.statuses.some(s => s.variant === 'warning') &&
    p.rehabilitationStatus !== 'rehabilitated'
  ).length

  const rehabilitated = projects.filter(p =>
    Array.isArray(p.statuses) &&
    p.statuses.some(s => s.variant === 'warning') &&
    p.rehabilitationStatus === 'rehabilitated'
  ).length

  const errors = projects.filter(p =>
    Array.isArray(p.statuses) && p.statuses.some(s => s.variant === 'info')
  ).length

  return { totalProjects: total, deformations, rehabilitating, rehabilitated, errors, totalSurveys }
}

// ── Recent surveys — queries Survey table so both new projects and
//    survey updates on existing projects appear as "recent activity" ───────────

export async function getRecentSurveys(start, end) {
  const since = start instanceof Date ? start : (() => {
    const d = new Date(); d.setDate(d.getDate() - 7); d.setHours(0, 0, 0, 0); return d
  })()
  const until = end instanceof Date ? end : new Date()

  const surveys = await prisma.survey.findMany({
    where:   { createdAt: { gte: since, lte: until } },
    include: { project: { select: { statuses: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return surveys.map(s => {
    const projectStatuses = s.project?.statuses
    const statuses =
      Array.isArray(projectStatuses) && projectStatuses.length > 0
        ? projectStatuses.map(st => ({ variant: st.variant }))
        : [{ variant: s.status ?? 'success' }]
    return {
      id:       s.id,
      local:    s.local,
      file:     s.file || '—',
      statuses,
      date:     s.createdAt.toLocaleDateString('pt-BR'),
      surveys:  s.count,
      metering: s.metering ?? '—',
    }
  })
}

// ── Analytics — counts Survey records so updates on existing projects
//    register as activity in the chart, not just new project creations ────────

function aggEntry(label) {
  return { label, surveys: 0, approved: 0, deformations: 0, rehabilitating: 0, errors: 0 }
}

function tallySurvey(entry, survey) {
  entry.surveys++
  if      (survey.status === 'danger')  entry.deformations++
  else if (survey.status === 'warning') entry.rehabilitating++
  else if (survey.status === 'info')    entry.errors++
  else                                   entry.approved++
}

const DAY_LABELS   = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const ORDERED_DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function aggregateByDay(surveys) {
  const map = Object.fromEntries(ORDERED_DAYS.map(d => [d, aggEntry(d)]))
  for (const s of surveys) {
    const label = DAY_LABELS[new Date(s.createdAt).getDay()]
    if (map[label]) tallySurvey(map[label], s)
  }
  return ORDERED_DAYS.map(d => map[d])
}

function aggregateByWeek(surveys) {
  const weeks = [aggEntry('Sem 1'), aggEntry('Sem 2'), aggEntry('Sem 3'), aggEntry('Sem 4')]
  for (const s of surveys) {
    const day = new Date(s.createdAt).getDate()
    const idx = Math.min(Math.floor((day - 1) / 7), 3)
    tallySurvey(weeks[idx], s)
  }
  return weeks
}

function aggregateByMonth(surveys) {
  const map = Object.fromEntries(MONTH_LABELS.map((m, i) => [i, aggEntry(m)]))
  for (const s of surveys) {
    const month = new Date(s.createdAt).getMonth()
    tallySurvey(map[month], s)
  }
  return MONTH_LABELS.map((_, i) => map[i])
}

export async function getAnalytics(period = 'weekly', month) {
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

  const dateFilter = until
    ? { createdAt: { gte: since, lte: until } }
    : { createdAt: { gte: since } }

  const surveys = await prisma.survey.findMany({
    where:   dateFilter,
    orderBy: { createdAt: 'asc' },
    select:  { createdAt: true, status: true },
  })

  let chartData
  if (period === 'weekly')       chartData = aggregateByDay(surveys)
  else if (period === 'monthly') chartData = aggregateByWeek(surveys)
  else                           chartData = aggregateByMonth(surveys)

  return { period, chartData }
}

export async function getRehabilitatedProjects() {
  const projects = await prisma.project.findMany({
    where:   { rehabilitationStatus: 'rehabilitated' },
    select:  { id: true, code: true, updatedAt: true, statuses: true },
    orderBy: { updatedAt: 'desc' },
    take:    10,
  })
  return projects.map(p => ({
    id:   p.id,
    code: p.code,
    date: p.updatedAt.toLocaleDateString('pt-BR'),
  }))
}
