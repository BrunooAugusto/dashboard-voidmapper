import { supabase } from '../lib/supabase.js'
import { aggregateChartData } from './surveyService.js'
import { getMonitoringRows } from './monitoringService.js'

// Build weekly metragem breakdown (used in the report section)
function computeWeeklyBreakdown(surveys, start, end) {
  if (!start || !end) return []
  const weeks = []
  let cur = new Date(start)
  cur.setHours(0, 0, 0, 0)
  let weekNum = 1

  while (cur <= end) {
    const wEnd = new Date(cur)
    wEnd.setDate(wEnd.getDate() + 6)
    wEnd.setHours(23, 59, 59, 999)
    const actualEnd = wEnd > end ? new Date(end) : wEnd

    const wSurveys = surveys.filter(s => {
      const d = new Date(s.created_at)
      return d >= cur && d <= actualEnd
    })

    const metragem = wSurveys.reduce((sum, s) => {
      const raw = s.metering ?? (s.projects?.project_length != null ? String(s.projects.project_length) : null)
      if (!raw) return sum
      const v = parseFloat(raw)
      return (!isNaN(v) && v > 0) ? sum + v : sum
    }, 0)

    weeks.push({
      week: weekNum,
      startDate: new Date(cur),
      endDate: new Date(actualEnd),
      metragem,
      surveyCount: wSurveys.length,
    })

    cur = new Date(wEnd)
    cur.setDate(cur.getDate() + 1)
    cur.setHours(0, 0, 0, 0)
    weekNum++
  }

  return weeks
}

// Map a date range to the same period key the dashboard uses
function periodFromRange(start, end) {
  const days = Math.max(1, Math.ceil((new Date(end) - new Date(start)) / 86_400_000))
  if (days <= 14)  return 'weekly'
  if (days <= 366) return 'monthly'
  return 'annual'
}

export async function getWeeklyReportFull(start, end) {
  // ── 1. Fetch all surveys in the period with their project data ────────────
  let q = supabase
    .from('surveys')
    .select(
      'id, local, file, count, status, metering, created_at, ' +
      'projects(id, code, statuses, rehabilitation_status, file_name, notes, project_length, project_images(url))'
    )
    .order('created_at', { ascending: false })
  if (start) q = q.gte('created_at', start.toISOString())
  if (end)   q = q.lte('created_at', end.toISOString())

  const { data: rawSurveys, error: surveysError } = await q
  if (surveysError) throw new Error(surveysError.message)

  const surveys = rawSurveys ?? []

  // ── 2. Build survey rows for the "Novos Levantamentos" table ─────────────
  const surveyRows = surveys.map(s => {
    const ps = s.projects?.statuses
    const statuses = Array.isArray(ps) && ps.length > 0
      ? ps.map(st => ({ variant: st.variant }))
      : [{ variant: s.status ?? 'success' }]
    const rawMetering = s.metering ?? (s.projects?.project_length != null ? String(s.projects.project_length) : null)
    return {
      id:       s.id,
      local:    s.local,
      file:     s.file || '—',
      statuses,
      date:     new Date(s.created_at).toLocaleDateString('pt-BR'),
      surveys:  s.count,
      metering: rawMetering ? `${rawMetering} m` : '—',
    }
  })

  // ── 3. Collect unique projects that have surveys in the period ───────────
  const projectsMap = new Map()
  for (const s of surveys) {
    if (s.projects?.id != null && !projectsMap.has(s.projects.id)) {
      projectsMap.set(s.projects.id, s.projects)
    }
  }
  const periodProjects = [...projectsMap.values()]

  // ── 4. Metrics — only from period projects ───────────────────────────────
  const deformations = periodProjects.filter(p =>
    Array.isArray(p.statuses) && p.statuses.some(s => s.variant === 'danger')
  ).length
  const rehabilitating = periodProjects.filter(p =>
    Array.isArray(p.statuses) &&
    p.statuses.some(s => s.variant === 'warning') &&
    p.rehabilitation_status !== 'rehabilitated'
  ).length
  const rehabilitated = periodProjects.filter(p =>
    Array.isArray(p.statuses) &&
    p.statuses.some(s => s.variant === 'warning') &&
    p.rehabilitation_status === 'rehabilitated'
  ).length
  const errors = periodProjects.filter(p =>
    Array.isArray(p.statuses) && p.statuses.some(s => s.variant === 'info')
  ).length

  const metrics = {
    totalProjects: periodProjects.length,
    deformations,
    rehabilitating,
    rehabilitated,
    errors,
  }

  // ── 5. Project blocks — deformation and error sections ───────────────────
  const toBlock = p => ({
    id:       p.id,
    code:     p.code,
    fileName: p.file_name,
    notes:    p.notes,
    surveys:  null,
    date:     '—',
    images:   (p.project_images ?? []).map(img => img.url).slice(0, 2),
  })

  const deformationProjects = periodProjects
    .filter(p => Array.isArray(p.statuses) && p.statuses.some(s => s.variant === 'danger'))
    .map(toBlock)

  const errorProjects = periodProjects
    .filter(p => Array.isArray(p.statuses) && p.statuses.some(s => s.variant === 'info'))
    .map(toBlock)

  // ── 6. Rehab rows — projects with rehabilitation completed (warning + rehabilitated) ─
  const rehab = periodProjects
    .filter(p =>
      Array.isArray(p.statuses) &&
      p.statuses.some(s => s.variant === 'warning') &&
      p.rehabilitation_status === 'rehabilitated'
    )
    .map(p => {
      const latest = surveys
        .filter(s => s.projects?.id === p.id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
      return {
        id:   p.id,
        code: p.code,
        date: latest ? new Date(latest.created_at).toLocaleDateString('pt-BR') : '—',
      }
    })

  // ── 7. Metragem metrics ───────────────────────────────────────────────────
  const meteringValues = surveys.map(s => {
    const raw = s.metering ?? (s.projects?.project_length != null ? String(s.projects.project_length) : null)
    if (!raw) return null
    const val = parseFloat(raw)
    return !isNaN(val) && val > 0 ? val : null
  }).filter(v => v !== null)

  const total = meteringValues.reduce((sum, v) => sum + v, 0)
  const days  = start && end ? Math.max(1, Math.ceil((end - start) / 86_400_000)) : 7
  const metragemMetrics = {
    total,
    avg: total / days,
    max: meteringValues.length > 0 ? Math.max(...meteringValues) : 0,
  }

  // ── 8. Chart data — same aggregateChartData function used by the dashboard ─
  const chartData = aggregateChartData(surveys, periodFromRange(start, end))

  // ── 9. Monitoring rows (current state — overdue alerts are time-sensitive) ─
  const monitoring = await getMonitoringRows()

  const weeklyBreakdown = computeWeeklyBreakdown(surveys, start, end)

  return { metrics, surveys: surveyRows, rehab, monitoring, deformationProjects, errorProjects, metragemMetrics, chartData, weeklyBreakdown }
}

export async function getWeeklyReport() {
  try {
    return await getWeeklyReportFull()
  } catch {
    return null
  }
}

export async function generateReport(payload) {
  const {
    periodStart, periodEnd, observations, conclusion,
    newSurveys = 0, deformations = 0, rehabilitation = 0, errors = 0,
  } = payload ?? {}

  const { data, error } = await supabase.from('reports').insert({
    week_start:     periodStart ? new Date(periodStart).toISOString() : new Date().toISOString(),
    week_end:       periodEnd   ? new Date(periodEnd).toISOString()   : new Date().toISOString(),
    new_surveys:    Number(newSurveys)     || 0,
    deformations:   Number(deformations)   || 0,
    rehabilitation: Number(rehabilitation) || 0,
    errors:         Number(errors)         || 0,
    observations:   observations ?? null,
    conclusion:     conclusion   ?? null,
  }).select().single()

  if (error) throw new Error(error.message)
  return { ...data, generatedAt: data.created_at }
}
