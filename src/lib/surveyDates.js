// ─────────────────────────────────────────────────────────────────────────────
//  surveyDates — fonte única de verdade para datas de levantamentos
//
//  Bug raiz: new Date("2026-04-23T00:00:00+00:00") em UTC-3 dá "22/04/2026".
//  Fix: qualquer string que contenha YYYY-MM-DD tem a parte da data extraída
//  e parseada como meia-noite LOCAL, nunca UTC.
//  Isso garante consistência para DATE, TIMESTAMP e TIMESTAMPTZ do Supabase.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converte qualquer representação de data para Date local (sem shift de UTC).
 *
 * Formatos suportados:
 *   "2026-04-23"                        → extrai 2026-04-23 → local midnight
 *   "2026-04-23T00:00:00+00:00"         → extrai 2026-04-23 → local midnight
 *   "2026-04-23T14:30:00.000Z"          → extrai 2026-04-23 → local midnight
 *   "23/04/2026"                        → parse pt-BR → local midnight
 */
export function parseLocalDate(str) {
  if (!str) return null
  if (str instanceof Date) return isNaN(str) ? null : str
  const s = String(str).trim()

  // pt-BR: DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split('/').map(Number)
    const date = new Date(y, m - 1, d)
    return isNaN(date) ? null : date
  }

  // Extrai YYYY-MM-DD de QUALQUER formato ISO (date-only, datetime, com tz)
  // Isso evita o shift UTC → local para todos os formatos de uma vez
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    const y = Number(match[1])
    const m = Number(match[2])
    const d = Number(match[3])
    const date = new Date(y, m - 1, d)
    return isNaN(date) ? null : date
  }

  return null
}

// Alias compatível com código que usa parseSurveyDate
export const parseSurveyDate = parseLocalDate

/** Data efetiva de um survey: prefere .date, fallback .created_at */
export function getSurveyDate(survey) {
  return parseLocalDate(survey?.date) ?? parseLocalDate(survey?.created_at) ?? null
}

/** Retorna a data mais recente de uma lista de surveys (Date | null) */
export function getLatestSurveyDate(surveys) {
  if (!surveys?.length) return null
  let latest = null
  for (const s of surveys) {
    const d = getSurveyDate(s)
    if (d && (!latest || d > latest)) latest = d
  }
  return latest
}

/** Ordena surveys do mais recente para o mais antigo */
export function sortSurveysByDateDesc(surveys) {
  return [...(surveys ?? [])].sort((a, b) => {
    const da = getSurveyDate(a)?.getTime() ?? 0
    const db = getSurveyDate(b)?.getTime() ?? 0
    return db - da  // desc: maior timestamp primeiro
  })
}

/** Formata Date → "DD/MM/AAAA" */
export function formatDateBR(date) {
  if (!date || !(date instanceof Date) || isNaN(date)) return '—'
  return date.toLocaleDateString('pt-BR', {
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric',
  })
}

/** Converte string de data → "DD/MM/AAAA" (corrige timezone) */
export function formatSurveyDate(str) {
  return formatDateBR(parseLocalDate(str))
}

/** Debug: imprime tabela de surveys com datas parseadas */
export function debugSurveyDates(surveys, label = 'surveys') {
  const rows = (surveys ?? []).map(s => ({
    id:          s.id,
    date:        s.date ?? '—',
    created_at:  s.created_at ? String(s.created_at).slice(0, 10) : '—',
    parsedDate:  formatDateBR(getSurveyDate(s)),
  }))
  console.table(rows, ['id', 'date', 'created_at', 'parsedDate'])

  const latest = getLatestSurveyDate(surveys)
  console.log(`[${label}] latestSurveyDate: ${formatDateBR(latest)} (${latest?.toISOString() ?? 'null'})`)
}