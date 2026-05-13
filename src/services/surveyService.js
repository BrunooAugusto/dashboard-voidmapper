import { supabase } from '../lib/supabase.js'

// ── Dashboard metrics ────────────────────────────────────────────────────────

export async function getMetrics() {
  const [{ data: projects }, { count: totalSurveys }] = await Promise.all([
    supabase.from('projects').select('statuses, rehabilitation_status'),
    supabase.from('surveys').select('*', { count: 'exact', head: true }),
  ])

  const ps = projects ?? []
  const total = ps.length

  const deformations = ps.filter(p =>
    Array.isArray(p.statuses) && p.statuses.some(s => s.variant === 'danger')
  ).length

  const rehabilitating = ps.filter(p =>
    Array.isArray(p.statuses) &&
    p.statuses.some(s => s.variant === 'warning') &&
    p.rehabilitation_status !== 'rehabilitated'
  ).length

  const rehabilitated = ps.filter(p =>
    Array.isArray(p.statuses) &&
    p.statuses.some(s => s.variant === 'warning') &&
    p.rehabilitation_status === 'rehabilitated'
  ).length

  const errors = ps.filter(p =>
    Array.isArray(p.statuses) && p.statuses.some(s => s.variant === 'info')
  ).length

  return { totalProjects: total, deformations, rehabilitating, rehabilitated, errors, totalSurveys: totalSurveys ?? 0 }
}

// ── Recent surveys (last 7 days) ─────────────────────────────────────────────

export async function getRecentSurveys() {
  const since = new Date()
  since.setDate(since.getDate() - 7)
  since.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('surveys')
    .select('*, projects(statuses)')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)

  return (data ?? []).map(s => {
    const ps = s.projects?.statuses
    const statuses =
      Array.isArray(ps) && ps.length > 0
        ? ps.map(st => ({ variant: st.variant }))
        : [{ variant: s.status ?? 'success' }]
    return {
      id:       s.id,
      local:    s.local,
      file:     s.file || '—',
      statuses,
      date:     new Date(s.created_at).toLocaleDateString('pt-BR'),
      surveys:  s.count,
      metering: s.metering ?? '—',
    }
  })
}

// ── Rehabilitated projects list ──────────────────────────────────────────────

export async function getRehabilitatedProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('id, code, updated_at, statuses')
    .eq('rehabilitation_status', 'rehabilitated')
    .order('updated_at', { ascending: false })
    .limit(10)
  if (error) throw new Error(error.message)
  return (data ?? []).map(p => ({
    id:   p.id,
    code: p.code,
    date: new Date(p.updated_at).toLocaleDateString('pt-BR'),
  }))
}

// ── Survey analytics ─────────────────────────────────────────────────────────

const DAY_LABELS   = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const ORDERED_DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function aggEntry(label) {
  return { label, surveys: 0, approved: 0, deformations: 0, rehabilitating: 0, errors: 0 }
}

function tallySurvey(entry, s) {
  entry.surveys++
  if      (s.status === 'danger')  entry.deformations++
  else if (s.status === 'warning') entry.rehabilitating++
  else if (s.status === 'info')    entry.errors++
  else                              entry.approved++
}

function aggregateChartData(surveys, period) {
  if (period === 'weekly') {
    const map = Object.fromEntries(ORDERED_DAYS.map(d => [d, aggEntry(d)]))
    for (const s of surveys) {
      const label = DAY_LABELS[new Date(s.created_at).getDay()]
      if (map[label]) tallySurvey(map[label], s)
    }
    return ORDERED_DAYS.map(d => map[d])
  }
  if (period === 'monthly') {
    const weeks = [aggEntry('Sem 1'), aggEntry('Sem 2'), aggEntry('Sem 3'), aggEntry('Sem 4')]
    for (const s of surveys) {
      const day = new Date(s.created_at).getDate()
      tallySurvey(weeks[Math.min(Math.floor((day - 1) / 7), 3)], s)
    }
    return weeks
  }
  // annual
  const map = Object.fromEntries(MONTH_LABELS.map((m, i) => [i, aggEntry(m)]))
  for (const s of surveys) tallySurvey(map[new Date(s.created_at).getMonth()], s)
  return MONTH_LABELS.map((_, i) => map[i])
}

export async function getSurveyAnalytics(period = 'weekly', month) {
  const now = new Date()
  let since, until = null

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

  let query = supabase
    .from('surveys')
    .select('created_at, status')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true })
  if (until) query = query.lte('created_at', until.toISOString())

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return aggregateChartData(data ?? [], period)
}

export async function getReportData() {
  return {}
}
