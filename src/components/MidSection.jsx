import WeeklyChartCard from './WeeklyChartCard'
import RehabilitatedProjectsCard from './RehabilitatedProjectsCard'

export default function MidSection({ onSelectProject }) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-[587fr_493fr] gap-4 3xl:gap-5 4xl:gap-6">
      <WeeklyChartCard />
      <RehabilitatedProjectsCard onSelectProject={onSelectProject} />
    </section>
  )
}
