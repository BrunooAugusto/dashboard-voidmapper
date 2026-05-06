import {
  WEEKLY_CHART_DATA,
  CHART_MAX,
  CHART_TICKS,
  CHART_SERIES,
} from '../data/dashboard'

function ChartLegend() {
  return (
    <div className="flex items-center gap-4">
      {CHART_SERIES.map((s) => (
        <div key={s.id} className="flex items-center gap-2">
          <span className={`block w-[5px] h-[5px] rounded-full ${s.dot}`} />
          <span className="text-[11px] font-medium text-ink-500">{s.label}</span>
        </div>
      ))}
    </div>
  )
}

function YAxis() {
  return (
    <div className="relative h-full w-9 pr-2 text-right">
      {[...CHART_TICKS].reverse().map((tick) => (
        <div
          key={tick}
          className="absolute right-2 text-[10px] leading-none text-ink-400 -translate-y-1/2"
          style={{ top: `${((CHART_MAX - tick) / CHART_MAX) * 100}%` }}
        >
          {tick.toLocaleString('en-US')}
        </div>
      ))}
    </div>
  )
}

function GridLines() {
  return (
    <>
      {CHART_TICKS.map((tick) => (
        <div
          key={tick}
          className="absolute left-0 right-0 h-px bg-border-soft"
          style={{ top: `${((CHART_MAX - tick) / CHART_MAX) * 100}%` }}
        />
      ))}
    </>
  )
}

function BarColumn({ datum }) {
  const segments = [
    { value: datum.openRate, color: CHART_SERIES[0].color },
    { value: datum.ctr, color: CHART_SERIES[1].color },
    { value: datum.bounce, color: CHART_SERIES[2].color },
  ]

  let cumulative = 0
  const stacked = segments.map((s, i) => {
    const bottom = (cumulative / CHART_MAX) * 100
    const height = (s.value / CHART_MAX) * 100
    cumulative += s.value
    return { ...s, bottom, height, isTop: i === segments.length - 1 }
  })

  return (
    <div className="flex-1 h-full flex justify-center">
      <div className="relative h-full w-[60%] max-w-[20px]">
        {/* Light-gray full-height track */}
        <div className="absolute inset-0 bg-page rounded-[3px]" />

        {/* Stacked orange segments anchored to bottom */}
        {stacked.map((s, i) => (
          <div
            key={i}
            className={`absolute left-0 right-0 ${s.color} ${s.isTop ? 'rounded-t-[3px]' : ''}`}
            style={{
              bottom: `${s.bottom}%`,
              height: `${s.height}%`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default function WeeklyBarChart() {
  return (
    <div className="h-full w-full p-4 flex flex-col">
      {/* Legend */}
      <div className="pl-9 mb-3">
        <ChartLegend />
      </div>

      {/* Plot area: y-axis + grid + bars */}
      <div className="relative flex-1 flex">
        <YAxis />

        <div className="relative flex-1">
          <GridLines />

          {/* Bars layer sits above grid */}
          <div className="absolute inset-0 flex items-end gap-[6px] pb-px">
            {WEEKLY_CHART_DATA.map((d) => (
              <BarColumn key={d.month} datum={d} />
            ))}
          </div>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex pl-9 pt-2">
        <div className="flex-1 flex gap-[6px]">
          {WEEKLY_CHART_DATA.map((d) => (
            <div
              key={d.month}
              className="flex-1 text-center text-[10px] leading-none text-ink-400"
            >
              {d.month}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
