import Card from './Card'
import CardHeader from './CardHeader'
import FilterButton from './FilterButton'
import WeeklyBarChart from './WeeklyBarChart'
import { useLanguage } from '../contexts/LanguageContext'

export default function WeeklyChartCard() {
  const { t } = useLanguage()
  return (
    <Card className="h-[307px]">
      <CardHeader
        title={t('chart.title')}
        size="compact"
        divider={true}
        action={<FilterButton label={t('chart.filter')} />}
      />
      <div className="flex-1 min-h-0">
        <WeeklyBarChart />
      </div>
    </Card>
  )
}
