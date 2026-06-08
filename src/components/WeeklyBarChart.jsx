import { useState, useEffect, useRef, useId, useMemo } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

const PAD    = { top: 20, right: 24, bottom: 40, left: 50 }
const X_INNER = 20   // inset so first/last points don't sit flush at the grid edges

function catmullRom(pts, tension = 0.4) {
  if (pts.length < 2) return ''
  const d = []
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const cp1x = p1.x + (p2.x - p0.x) * (tension / 2)
    const cp1y = p1.y + (p2.y - p0.y) * (tension / 2)
    const cp2x = p2.x - (p3.x - p1.x) * (tension / 2)
    const cp2y = p2.y - (p3.y - p1.y) * (tension / 2)
    if (i === 0) d.push(`M${p1.x},${p1.y}`)
    d.push(`C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`)
  }
  return d.join(' ')
}

function niceMax(v) {
  if (v <= 0) return 500
  const mag = Math.pow(10, Math.floor(Math.log10(v)))
  const normalized = v / mag
  for (const n of [1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
    if (normalized < n) return Math.round(n * mag)
  }
  return Math.round(10 * mag)
}

function TipRow({ dot, label, value }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
        <span className="text-[11px] text-ink-500">{label}</span>
      </div>
      <span className="text-[11px] font-semibold text-ink-900">{value}</span>
    </div>
  )
}

export default function SurveyAreaChart({ data }) {
  const { t } = useLanguage()
  const gradId  = useId()
  const clipId  = useId()
  const containerRef = useRef(null)
  const [dims, setDims] = useState({ width: 500, height: 220 })
  const [hoverIdx, setHoverIdx] = useState(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) setDims({ width, height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Reset hover when data changes (e.g. period/month switch)
  useEffect(() => { setHoverIdx(null) }, [data])

  const chartW = dims.width  - PAD.left - PAD.right
  const chartH = dims.height - PAD.top  - PAD.bottom
  const bottomY = PAD.top + chartH

  const max = useMemo(() => niceMax(Math.max(...data.map((d) => d.metragem ?? 0), 0)), [data])
  const ticks = useMemo(() => {
    const step = max / 4
    return [0, step, step * 2, step * 3, max]
  }, [max])

  const pts = useMemo(
    () =>
      data.map((d, i) => ({
        x: PAD.left + X_INNER + (data.length <= 1 ? (chartW - 2 * X_INNER) / 2 : (i / (data.length - 1)) * (chartW - 2 * X_INNER)),
        y: PAD.top  + (max > 0 ? (1 - (d.metragem ?? 0) / max) * chartH : chartH),
      })),
    [data, chartW, chartH, max],
  )

  const linePath = catmullRom(pts)
  const areaPath =
    pts.length >= 2
      ? `${linePath} L${pts.at(-1).x},${bottomY} L${pts[0].x},${bottomY}Z`
      : ''

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onMouseLeave={() => setHoverIdx(null)}
    >
      <svg className="absolute inset-0 w-full h-full" overflow="hidden">
        <defs>
          <linearGradient
            id={gradId}
            x1="0" y1={PAD.top} x2="0" y2={bottomY}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%"   stopColor="var(--color-brand-500)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity="0.01" />
          </linearGradient>

          {/*
            Clip only vertically — extends full SVG width so bezier control
            points beyond the first/last data points are never cut on the sides.
            4px extra at the bottom prevents the stroke from being sliced at y=0.
          */}
          <clipPath id={clipId}>
            <rect x={0} y={PAD.top - 8} width={dims.width} height={chartH + 12} />
          </clipPath>
        </defs>

        {/* ── 1. Area fill — rendered FIRST so grid lines paint on top of it */}
        {areaPath && (
          <g clipPath={`url(#${clipId})`}>
            <path d={areaPath} fill={`url(#${gradId})`} />
          </g>
        )}

        {/* ── 2. Grid lines + Y-axis labels — above area, below line ──────── */}
        {ticks.map((tick) => {
          const y = PAD.top + (max > 0 ? (1 - tick / max) * chartH : chartH)
          return (
            <g key={tick}>
              <line
                x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y}
                stroke="var(--color-border-soft)" strokeWidth="1"
              />
              <text
                x={PAD.left - 6} y={y}
                textAnchor="end" dominantBaseline="middle"
                fontSize="10" fill="var(--color-ink-400)"
              >
                {tick}
              </text>
            </g>
          )
        })}

        {/* ── 3. X-axis labels — below chart baseline ─────────────────────── */}
        {data.map((d, i) => (
          <text
            key={d.label}
            x={pts[i]?.x ?? 0}
            y={bottomY + 16}
            textAnchor="middle"
            fontSize="10"
            fill="var(--color-ink-400)"
          >
            {d.label}
          </text>
        ))}

        {/* ── 4. Line + hover — rendered LAST so always on top of grid ─────── */}
        <g clipPath={`url(#${clipId})`}>

          {/* Hover guide — behind line */}
          {hoverIdx !== null && (
            <line
              x1={pts[hoverIdx].x} y1={PAD.top}
              x2={pts[hoverIdx].x} y2={bottomY}
              stroke="var(--color-brand-500)" strokeWidth="1"
              strokeDasharray="4 3" opacity="0.4"
            />
          )}

          {/* Line — clearly above grid lines */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="var(--color-brand-500)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Active point marker */}
          {hoverIdx !== null && (() => {
            const pt = pts[hoverIdx]
            return (
              <>
                <circle cx={pt.x} cy={pt.y} r={16} fill="var(--color-brand-500)" fillOpacity="0.07" />
                <circle cx={pt.x} cy={pt.y} r={9}  fill="var(--color-brand-500)" fillOpacity="0.15" />
                <circle cx={pt.x} cy={pt.y} r={4}  fill="var(--color-surface)"   stroke="var(--color-brand-500)" strokeWidth="2.5" />
              </>
            )
          })()}

        </g>

        {/* ── 5. Invisible hover hit areas ─────────────────────────────────── */}
        {pts.map((pt, i) => {
          const x1 = i === 0              ? PAD.left           : (pts[i - 1].x + pt.x) / 2
          const x2 = i === pts.length - 1 ? PAD.left + chartW  : (pt.x + pts[i + 1].x) / 2
          return (
            <rect
              key={i}
              x={x1} y={PAD.top} width={x2 - x1} height={chartH}
              fill="transparent"
              style={{ cursor: 'crosshair' }}
              onMouseEnter={() => setHoverIdx(i)}
            />
          )
        })}
      </svg>

      {/* ── Tooltip HTML overlay ─────────────────────────────────────────── */}
      {hoverIdx !== null && (() => {
        const item = data[hoverIdx]
        const pt   = pts[hoverIdx]
        const ttW  = 180
        let   left = pt.x - ttW / 2
        if (left < 4)                        left = 4
        if (left + ttW > dims.width - 4)     left = dims.width - 4 - ttW
        const above = pt.y > dims.height / 2
        return (
          <div
            className="absolute pointer-events-none bg-surface border border-border-soft rounded-xl px-3 py-2.5 z-10"
            style={{
              width: ttW,
              left,
              top:       above ? pt.y - 12 : pt.y + 12,
              transform: above ? 'translateY(-100%)' : 'translateY(0)',
            }}
          >
            <p className="text-xs font-semibold text-ink-900 mb-2">{item.label}</p>
            <div className="flex flex-col gap-1.5">
              <TipRow dot="bg-brand-500" label={t('chart.tooltip.metragem')} value={`${Math.round(item.metragem ?? 0)} m`} />
            </div>
          </div>
        )
      })()}
    </div>
  )
}
