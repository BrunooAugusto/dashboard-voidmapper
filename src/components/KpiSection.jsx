import KpiCard from './KpiCard'
import KpiPill from './KpiPill'
import LinkAction from './LinkAction'
import { useLanguage } from '../contexts/LanguageContext'

function renderAction(action, idx) {
  if (action.kind === 'pill-light')
    return <KpiPill key={idx} variant="light">{action.label}</KpiPill>
  if (action.kind === 'pill-dark')
    return <KpiPill key={idx} variant="dark">{action.label}</KpiPill>
  return <LinkAction key={idx}>{action.label}</LinkAction>
}

export default function KpiSection() {
  const { t } = useLanguage()

  const KPIS = [
    {
      id: 'total',
      variant: 'accent',
      title: t('kpi.totalProjects'),
      value: '36',
      actions: [
        { label: t('kpi.viewProjects'), kind: 'pill-light' },
        { label: t('kpi.newProject'),   kind: 'pill-dark' },
      ],
    },
    {
      id: 'deformacoes',
      title: t('kpi.deformations'),
      value: '11',
      actions: [{ label: t('kpi.viewProjects'), kind: 'link' }],
    },
    {
      id: 'reabilitando',
      title: t('kpi.rehabilitating'),
      value: '3',
      actions: [{ label: t('kpi.viewProjects'), kind: 'link' }],
    },
    {
      id: 'erros',
      title: t('kpi.errors'),
      value: '2',
      actions: [{ label: t('kpi.viewProjects'), kind: 'link' }],
    },
  ]

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {KPIS.map((kpi) => (
        <KpiCard
          key={kpi.id}
          variant={kpi.variant}
          title={kpi.title}
          value={kpi.value}
          footer={
            <div className="flex items-center gap-3 flex-wrap">
              {kpi.actions.map(renderAction)}
            </div>
          }
        />
      ))}
    </section>
  )
}
