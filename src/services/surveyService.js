import { supabase } from '../lib/supabase.js'
import { formatSurveyDate, getSurveyDate, sortSurveysByDateDesc } from '../lib/surveyDates.js'

// ── Dashboard metrics ────────────────────────────────────────────────────────

export async function getMetrics() {
  const [projectsRes, surveysRes] = await Promise.all([
    supabase.from('projects').select('statuses, rehabilitation_status'),
    supabase.from('surveys').select('count, file_type'),
  ])

  let totalSurveys = 0
  if (surveysRes.error?.code === '42703') {
    // file_type column not yet migrated — fall back to raw row count
    const { count } = await supabase.from('surveys').select('*', { count: 'exact', head: true })
    totalSurveys = count ?? 0
    console.warn('[metrics] file_type column not found, usando contagem bruta:', totalSurveys)
  } else if (!surveysRes.error) {
    const sd = surveysRes.data ?? []
    const ltcCount  = sd.filter(s => s.file_type === 'ltc').length
    const stcCount  = sd.filter(s => s.file_type === 'stc').length
    const levs = sd.filter(s => !s.file_type || s.file_type === 'levantamento')
    totalSurveys = levs.reduce((sum, s) => sum + Math.max(parseInt(s.count, 10) || 1, 1), 0)
    console.log(`[metrics] total surveys: ${sd.length} | ltc: ${ltcCount} | stc: ${stcCount} | levantamentos contados: ${totalSurveys}`)
  }

  const ps = projectsRes.data ?? []
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

  // Filter by survey DATE (not created_at) so backdated entries don't appear here
  const { data, error } = await supabase
    .from('surveys')
    .select('*, projects(statuses, project_length)')
    .gte('date', since.toISOString())
    .order('date', { ascending: false })
  if (error) throw new Error(error.message)

  // Only levantamentos count toward production metrics
  return (data ?? []).filter(s => !s.file_type || s.file_type === 'levantamento').map(s => {
    const ps = s.projects?.statuses
    const statuses =
      Array.isArray(ps) && ps.length > 0
        ? ps.map(st => ({ variant: st.variant }))
        : [{ variant: s.status ?? 'success' }]

    const rawMetering =
      s.metering ||
      (s.projects?.project_length != null ? String(s.projects.project_length) : null)
    const metering = rawMetering ? `${rawMetering} m` : '—'

    return {
      id:       s.id,
      local:    s.local,
      file:     s.file || '—',
      statuses,
      date:     formatSurveyDate(s.date || s.created_at),
      surveys:  s.count,
      metering,
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
export const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function aggEntry(label) {
  return { label, metragem: 0, count: 0 }
}

function tallyEntry(entry, s) {
  const raw = s.metering ?? (s.projects?.project_length != null ? String(s.projects.project_length) : null)
  if (raw) {
    const val = parseFloat(String(raw))
    if (!isNaN(val) && val > 0) entry.metragem += val
  }
  const c = parseInt(s.count, 10)
  entry.count += (isNaN(c) || c < 1) ? 1 : c
}

/**
 * Aggregates surveys by granularity.
 *
 * granularity: 'day' | 'month' | 'year'
 *   — or legacy: 'weekly' | 'monthly' | 'annual' (backward compat for reportService)
 *
 * opts: { since?: Date, until?: Date }
 *
 * Always returns { label, metragem, count }[] so callers can switch metrics
 * without re-fetching.
 */
export function aggregateChartData(surveys, granularity, opts = {}) {
  const { since, until } = opts

  // ── Legacy strings (used by reportService) ────────────────────────────────
  if (granularity === 'weekly') {
    const map = Object.fromEntries(ORDERED_DAYS.map(d => [d, aggEntry(d)]))
    for (const s of surveys) {
      const d = getSurveyDate(s)
      if (!d) continue
      const label = DAY_LABELS[d.getDay()]
      if (map[label]) tallyEntry(map[label], s)
    }
    return ORDERED_DAYS.map(d => map[d])
  }
  if (granularity === 'monthly') {
    const weekCount = opts.until
      ? Math.ceil(opts.until.getDate() / 7)
      : 4
    const weeks = Array.from({ length: weekCount }, (_, i) => aggEntry(`Semana ${i + 1}`))
    for (const s of surveys) {
      const d = getSurveyDate(s)
      if (!d) continue
      tallyEntry(weeks[Math.min(Math.floor((d.getDate() - 1) / 7), weekCount - 1)], s)
    }
    return weeks
  }
  if (granularity === 'annual') {
    const map = Object.fromEntries(MONTH_LABELS.map((m, i) => [i, aggEntry(m)]))
    for (const s of surveys) {
      const d = getSurveyDate(s)
      if (!d) continue
      tallyEntry(map[d.getMonth()], s)
    }
    return MONTH_LABELS.map((_, i) => map[i])
  }

  // ── Day granularity ───────────────────────────────────────────────────────
  if (granularity === 'day') {
    const start = since ?? new Date()
    const end   = until ?? new Date()
    // For monthly views (>7 days) use day-number labels to avoid x-axis crowding
    const span = Math.round((end.getTime() - start.getTime()) / 86400000)
    const useDayOnly = span > 7
    const entries = new Map()
    const cur = new Date(start)
    cur.setHours(0, 0, 0, 0)
    const endD = new Date(end)
    endD.setHours(23, 59, 59, 999)
    while (cur <= endD) {
      const key   = cur.toDateString()
      const label = useDayOnly
        ? String(cur.getDate())
        : `${String(cur.getDate()).padStart(2, '0')}/${String(cur.getMonth() + 1).padStart(2, '0')}`
      entries.set(key, aggEntry(label))
      cur.setDate(cur.getDate() + 1)
    }
    for (const s of surveys) {
      const d = getSurveyDate(s)
      if (!d) continue
      const key = d.toDateString()
      if (entries.has(key)) tallyEntry(entries.get(key), s)
    }
    return [...entries.values()]
  }

  // ── Month granularity ─────────────────────────────────────────────────────
  if (granularity === 'month') {
    const startYear = since?.getFullYear() ?? new Date().getFullYear()
    const endYear   = until?.getFullYear() ?? startYear

    if (startYear === endYear) {
      const months = MONTH_LABELS.map(label => aggEntry(label))
      for (const s of surveys) {
        const d = getSurveyDate(s)
        if (!d) continue
        tallyEntry(months[d.getMonth()], s)
      }
      return months
    }

    // Multi-year range: "Jan/24", "Fev/24", ...
    const result = []
    const cur = new Date(startYear, since?.getMonth() ?? 0, 1)
    const endM = new Date(endYear, until?.getMonth() ?? 11, 1)
    while (cur <= endM) {
      result.push({
        ...aggEntry(`${MONTH_LABELS[cur.getMonth()]}/${String(cur.getFullYear()).slice(2)}`),
        _y: cur.getFullYear(),
        _m: cur.getMonth(),
      })
      cur.setMonth(cur.getMonth() + 1)
    }
    for (const s of surveys) {
      const d = getSurveyDate(s)
      if (!d) continue
      const entry = result.find(e => e._y === d.getFullYear() && e._m === d.getMonth())
      if (entry) tallyEntry(entry, s)
    }
    return result.map(({ label, metragem, count }) => ({ label, metragem, count }))
  }

  // ── Year granularity ──────────────────────────────────────────────────────
  if (granularity === 'year') {
    const curYear = new Date().getFullYear()
    const map = {}
    for (let y = 2024; y <= curYear; y++) map[y] = aggEntry(String(y))
    for (const s of surveys) {
      const d = getSurveyDate(s)
      if (!d) continue
      const y = d.getFullYear()
      if (!map[y]) map[y] = aggEntry(String(y))
      tallyEntry(map[y], s)
    }
    return Object.keys(map).sort().map(y => ({ label: map[y].label, metragem: map[y].metragem, count: map[y].count }))
  }

  return []
}

// ── Available years (dynamic, based on actual survey dates) ─────────────────

export async function getAvailableYears() {
  let { data, error } = await supabase.from('surveys').select('date, created_at, file_type')
  if (error?.code === '42703') {
    ;({ data } = await supabase.from('surveys').select('date, created_at'))
  }
  const curYear = new Date().getFullYear()
  const years = new Set()
  for (let y = 2024; y <= curYear; y++) years.add(y)
  // Only levantamentos define the available year range — LTC/STC-only years are excluded
  for (const s of (data ?? []).filter(s => !s.file_type || s.file_type === 'levantamento')) {
    const d = getSurveyDate(s)
    if (d) years.add(d.getFullYear())
  }
  // Fill any gaps between 2024 and max year found
  const max = Math.max(...years)
  for (let y = 2024; y <= max; y++) years.add(y)
  return [...years].sort()
}

// ── Survey analytics (dashboard chart) ───────────────────────────────────────
//
// period:     'weekly' | 'monthly' | 'annual'
// year:       full year number (used by monthly + annual)
// month:      0-based month index (used by monthly)
// weekOffset: 0 = current week, -1 = last week, etc. (used by weekly)
//
// Fetches ALL surveys (no server-side date filter) so backdated historical
// surveys with a past date but recent created_at are always included.

export async function getSurveyAnalytics({ period = 'weekly', year, month, weekOffset = 0 } = {}) {
  const now = new Date()
  const selectedYear  = year  ?? now.getFullYear()
  const selectedMonth = month ?? now.getMonth()

  let since, until, granularity

  if (period === 'weekly') {
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    const dow = today.getDay() // 0=Sun
    const daysToMon = dow === 0 ? 6 : dow - 1
    since = new Date(today)
    since.setDate(today.getDate() - daysToMon + weekOffset * 7)
    until = new Date(since)
    until.setDate(since.getDate() + 6)
    until.setHours(23, 59, 59, 999)
    granularity = 'day'
  } else if (period === 'monthly') {
    since = new Date(selectedYear, selectedMonth, 1)
    until = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999)
    granularity = 'monthly'
  } else {
    // annual
    since = new Date(selectedYear, 0, 1)
    until = new Date(selectedYear, 11, 31, 23, 59, 59, 999)
    granularity = 'month'
  }

  // Fetch ALL surveys without date restriction — filtering by survey DATE happens client-side
  // so backdated historical surveys always appear in their correct period
  let { data, error } = await supabase
    .from('surveys')
    .select('id, date, created_at, metering, count, file_type')
  if (error?.code === '42703') {
    console.warn('[chart] file_type column not found, treating all surveys as levantamentos')
    ;({ data, error } = await supabase
      .from('surveys')
      .select('id, date, created_at, metering, count'))
  }
  if (error) throw new Error(error.message)

  const allData = data ?? []
  const ltcCount = allData.filter(s => s.file_type === 'ltc').length
  const stcCount = allData.filter(s => s.file_type === 'stc').length
  const levCount = allData.filter(s => !s.file_type || s.file_type === 'levantamento').length
  console.log(
    `[chart period=${period}] LEVANTAMENTOS: ${levCount}\n` +
    `LTC: ${ltcCount}\n` +
    `STC: ${stcCount}\n` +
    `UTILIZADOS NO GRÁFICO: ${levCount}`
  )

  // Only levantamentos feed the chart — LTC/STC are excluded from all graphs
  const surveys = allData.filter(s => {
    if (s.file_type && s.file_type !== 'levantamento') return false
    const d = getSurveyDate(s)
    if (!d) return false
    return d >= since && d <= until
  })

  return aggregateChartData(surveys, granularity, { since, until })
}

export async function getReportData() {
  return {}
}
