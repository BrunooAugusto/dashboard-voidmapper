import { useState, useEffect } from 'react'
import KpiCard from './KpiCard'
import KpiPill from './KpiPill'
import LinkAction from './LinkAction'
import { getMetrics } from '../services/surveyService'
import { useLanguage } from '../contexts/LanguageContext'

export default function KpiSection({ onNavigate }) {
  const { t } = useLanguage()
  const [metrics, setMetrics] = useState({ totalProjects: 0, deformations: 0, rehabilitating: 0, rehabilitated: 0, errors: 0 })

  useEffect(() => {
    getMetrics().then(setMetrics).catch(console.error)
  }, [])

  const KPIS = [
    {
      id: 'total',
      variant: 'accent',
      title: t('kpi.totalProjects'),
      value: String(metrics.totalProjects),
      actions: [
        { label: t('kpi.viewProjects'), kind: 'pill-light', onClick: () => onNavigate?.('projetos') },
        { label: t('kpi.newProject'),   kind: 'pill-dark',  onClick: () => onNavigate?.('novo-projeto') },
      ],
    },
    {
      id: 'deformacoes',
      title: t('kpi.deformations'),
      value: String(metrics.deformations),
      actions: [{ label: t('kpi.viewProjects'), kind: 'link', onClick: () => onNavigate?.('projetos') }],
    },
    {
      id: 'reabilitando',
      title: t('kpi.rehabilitating'),
      value: String(metrics.rehabilitating),
      actions: [{ label: t('kpi.viewProjects'), kind: 'link', onClick: () => onNavigate?.('projetos') }],
    },
    {
      id: 'erros',
      title: t('kpi.errors'),
      value: String(metrics.errors),
      actions: [{ label: t('kpi.viewProjects'), kind: 'link', onClick: () => onNavigate?.('projetos') }],
    },
  ]

  function renderAction(action, idx) {
    if (action.kind === 'pill-light')
      return <KpiPill key={idx} variant="light" onClick={action.onClick}>{action.label}</KpiPill>
    if (action.kind === 'pill-dark')
      return <KpiPill key={idx} variant="dark" onClick={action.onClick}>{action.label}</KpiPill>
    return <LinkAction key={idx} onClick={action.onClick}>{action.label}</LinkAction>
  }

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 3xl:gap-5 4xl:gap-6">
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
