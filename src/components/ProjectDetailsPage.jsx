import { useState, useEffect } from 'react'
import { ArrowLeft, Pencil, Trash2, FileText, Image, Clock, Plus } from 'lucide-react'
import Card from './Card'
import MetaCard from './MetaCard'
import StatusBadge from './StatusBadge'
import ImageCarousel from './ImageCarousel'
import ConfirmModal from './ConfirmModal'
import { cn } from '../lib/cn'
import { getProjectById, getProjectSurveys, deleteProjectCascade, getSurveyImages } from '../services/projectService'
import { useLanguage } from '../contexts/LanguageContext'
import { getProjectAuditLogs, ACTION_LABELS } from '../services/auditService'
import { formatSurveyDate, sortSurveysByDateDesc } from '../lib/surveyDates.js'

const TYPE_BADGE_STYLES = {
  levantamento: 'bg-brand-500/10 text-brand-600 border-brand-500/20',
  ltc:          'bg-warning-bg text-warning-fg border-warning-fg/20',
  stc:          'bg-[#EEF2FF] text-[#4F46E5] border-[#6366F1]/20',
}

function TypeBadge({ type }) {
  const key = (type || 'levantamento').toLowerCase()
  return (
    <span className={cn(
      'shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold border uppercase',
      TYPE_BADGE_STYLES[key] ?? TYPE_BADGE_STYLES.levantamento,
    )}>
      {key}
    </span>
  )
}

// ── Main ProjectDetailsPage ───────────────────────────────────────────────────

export default function ProjectDetailsPage({ project, onBack, onEdit, onDelete, onNewSurvey }) {
  const { t } = useLanguage()
  const [detail, setDetail]             = useState(null)
  const [loading, setLoading]           = useState(true)
  const [surveys, setSurveys]           = useState([])
  const [confirming, setConfirming]     = useState(false)
  const [deleting, setDeleting]         = useState(false)
  const [deleteErr, setDeleteErr]       = useState(null)
  const [auditLogs, setAuditLogs]       = useState([])
  const [selectedSurvey, setSelectedSurvey] = useState(null)
  const [selectedSurveyImages, setSelectedSurveyImages] = useState([])

  useEffect(() => {
    if (!project?.id) { setLoading(false); return }
    setLoading(true)
    setSelectedSurvey(null)
    Promise.all([
      getProjectById(project.id),
      getProjectSurveys(project.id).catch(() => []),
      getProjectAuditLogs(project.id).catch(() => []),
    ]).then(([proj, srvs, logs]) => {
      setDetail(proj)
      setSurveys(srvs)
      setAuditLogs(logs)
    }).catch(() => setDetail(null))
      .finally(() => setLoading(false))
  }, [project?.id])

  useEffect(() => {
    if (!selectedSurvey?.id) { setSelectedSurveyImages([]); return }
    getSurveyImages(selectedSurvey.id)
      .then(imgs => setSelectedSurveyImages(imgs.map(i => i.url ?? i.src).filter(Boolean)))
      .catch(() => setSelectedSurveyImages([]))
  }, [selectedSurvey?.id])

  function selectSurvey(survey) {
    setSelectedSurvey((prev) => (prev?.id === survey.id ? null : survey))
  }

  function clearSelectedSurvey() {
    setSelectedSurvey(null)
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteErr(null)
    try {
      await deleteProjectCascade(project.id)
      onDelete?.()
    } catch (err) {
      setDeleteErr(err?.message ?? 'Erro ao excluir projeto')
      setDeleting(false)
    }
  }

  const d = detail ?? project
  const code = d?.code ?? '—'
  const statuses = d?.statuses?.length ? d.statuses : [{ variant: 'success' }]
  const surveyCount = Array.isArray(d?.surveys)
    ? (d?.surveyCount ?? d?.surveys.length)
    : Number(d?.surveys ?? d?.surveyCount ?? d?.survey_count ?? 0)
  const rehabStatus = d?.rehabilitationStatus
  const images = (d?.images ?? [])
    .map(img => img.url ?? img.src ?? img.path ?? img.imageUrl)
    .filter(Boolean)
  const projectUrl = d?.projectUrl || d?.projectLink || d?.link || d?.url || null

  // Conteúdo exibido nos cards/galeria: dados do levantamento selecionado
  // (quando houver) ou, por padrão, o agregado do projeto. O layout nunca muda.
  const displayDate     = selectedSurvey ? formatSurveyDate(selectedSurvey.date || selectedSurvey.createdAt) : (d?.date ?? '—')
  const displayMetragem = selectedSurvey ? (selectedSurvey.metering ? `${selectedSurvey.metering} m` : '—') : (d?.metragem ? `${d.metragem} m` : '—')
  const displayFileName = selectedSurvey ? (selectedSurvey.file || '—') : (d?.fileName ?? '—')
  const displayImages   = selectedSurvey ? selectedSurveyImages : images

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-ink-400">
        Carregando...
      </div>
    )
  }

  return (
    <>
      {confirming && (
        <ConfirmModal
          message="Tem certeza que deseja excluir este projeto? Esta ação removerá levantamentos, imagens e monitoramentos vinculados."
          onConfirm={handleDelete}
          onCancel={() => { if (!deleting) { setConfirming(false); setDeleteErr(null) } }}
          loading={deleting}
          error={deleteErr}
        />
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
          {t('detail.back')}
        </button>
        <span className="text-ink-400 text-sm">/</span>
        <span className="text-sm font-semibold text-ink-900">{code}</span>
      </div>

      <Card>
        <div className="p-4 sm:p-5 flex flex-col gap-3">

          {/* ── Header: code + statuses + rehab pill + edit button ── */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center flex-wrap gap-2 min-w-0">
              <span className="text-lg font-semibold text-ink-900 truncate">{code}</span>
              {statuses.map((s, i) => (
                <StatusBadge key={i} variant={s.variant}>{t('status.' + s.variant)}</StatusBadge>
              ))}
              {rehabStatus && (
                <span className={cn(
                  'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border',
                  rehabStatus === 'rehabilitated'
                    ? 'bg-[#EEF2FF] border-[#6366F1]/20 text-[#4F46E5]'
                    : 'bg-warning-bg border-warning-fg/20 text-warning-fg',
                )}>
                  <span className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    rehabStatus === 'rehabilitated' ? 'bg-[#6366F1]' : 'bg-warning-fg',
                  )} />
                  {rehabStatus === 'rehabilitated' ? 'Reabilitado' : 'Em Reabilitação'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onNewSurvey?.(d)}
                className="h-8 px-3 flex items-center gap-1.5 rounded-full border border-brand-500 text-brand-500 text-xs font-semibold hover:bg-brand-500/10 transition-colors"
              >
                <Plus className="w-3 h-3" strokeWidth={2} />
                {t('detail.newSurvey')}
              </button>
              <button
                type="button"
                onClick={() => onEdit?.(d)}
                className="h-8 px-3 flex items-center gap-1.5 rounded-full bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors"
              >
                <Pencil className="w-3 h-3" strokeWidth={2} />
                {t('detail.editProject')}
              </button>
              <button
                type="button"
                onClick={() => { setConfirming(true); setDeleteErr(null) }}
                className="h-8 w-8 flex items-center justify-center rounded-full border border-border-soft text-danger-fg hover:bg-danger-bg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* ── Two-column body ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

            {/* Left column: info + actions + history */}
            <div className="flex flex-col gap-3">

              {/* Selected survey indicator — só aparece quando um item do histórico está selecionado */}
              {selectedSurvey && (
                <div className="flex items-center justify-between gap-2 bg-brand-500/10 border border-brand-500/20 rounded-lg px-3 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <TypeBadge type={selectedSurvey.file_type} />
                    <span className="text-[11px] font-medium text-brand-600">selecionado no histórico</span>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelectedSurvey}
                    className="text-[11px] font-semibold text-brand-600 hover:underline"
                  >
                    Ver projeto
                  </button>
                </div>
              )}

              {/* Filename — compact single row */}
              <div className="flex items-center gap-2 bg-page border border-border-soft rounded-lg px-3 py-2 min-w-0">
                <FileText className="w-3.5 h-3.5 text-ink-400 shrink-0" strokeWidth={1.75} />
                <span className="text-[11px] font-medium text-ink-500 shrink-0">{t('detail.fileName')}</span>
                <span className="text-[11px] font-mono text-ink-700 truncate" title={displayFileName}>
                  {displayFileName}
                </span>
              </div>

              {/* 3 meta cards in a row */}
              <div className="grid grid-cols-3 gap-2">
                <MetaCard label={selectedSurvey ? 'Data' : t('detail.lastSurvey')} value={displayDate} />
                {selectedSurvey ? (
                  <MetaCard label="Tipo" value={(selectedSurvey.file_type || 'levantamento').toUpperCase()} />
                ) : (
                  <MetaCard label={t('detail.surveysCount')} value={String(surveyCount)} />
                )}
                <MetaCard label={t('detail.totalArea')} value={displayMetragem} />
              </div>

              {/* Notes */}
              {d?.notes && (
                <div className="bg-page border border-border-soft rounded-lg px-3 py-2.5">
                  <p className="text-xs text-ink-500 leading-relaxed">{d.notes}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2">
                {projectUrl ? (
                  <button
                    type="button"
                    onClick={() => window.open(projectUrl, '_blank', 'noopener,noreferrer')}
                    className="h-9 flex items-center justify-center rounded-full bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors"
                  >
                    {t('detail.projectLink')}
                  </button>
                ) : (
                  <div className="h-9 flex items-center justify-center rounded-full bg-surface border border-border-soft text-xs font-medium text-ink-400 select-none cursor-not-allowed">
                    {t('detail.noProjectLink')}
                  </div>
                )}
                <button
                  type="button"
                  className="h-9 flex items-center justify-center rounded-full border border-border-soft text-xs font-medium text-ink-700 hover:bg-page transition-colors"
                >
                  {t('detail.detonationAreas')}
                </button>
              </div>

              {/* Survey history — todos os tipos (Levantamento/LTC/STC), clicável */}
              {(() => {
                const allSurveys = sortSurveysByDateDesc(surveys)
                return (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-3.5 h-3.5 text-ink-400 shrink-0" strokeWidth={1.75} />
                      <span className="text-xs font-semibold text-ink-700">Histórico de Levantamentos</span>
                      {allSurveys.length > 0 && (
                        <span className="text-[10px] font-bold text-brand-500 bg-brand-500/10 px-1.5 py-0.5 rounded-full">
                          {allSurveys.length}
                        </span>
                      )}
                    </div>
                    {allSurveys.length > 0 && (
                      <div className="flex flex-col divide-y divide-border-soft rounded-lg border border-border-soft overflow-hidden max-h-[300px] overflow-y-auto">
                        {allSurveys.map((s, i) => (
                          <button
                            key={s.id ?? i}
                            type="button"
                            onClick={() => selectSurvey(s)}
                            className={cn(
                              'flex items-center gap-2 px-3 py-2.5 text-xs transition-colors text-left w-full group',
                              selectedSurvey?.id === s.id ? 'bg-brand-500/10' : 'bg-page hover:bg-surface',
                            )}
                          >
                            <TypeBadge type={s.file_type} />
                            <span className="font-medium truncate flex-1 text-ink-700" title={s.file}>
                              {s.file || '—'}
                            </span>
                            <span className="text-ink-400 shrink-0">
                              {formatSurveyDate(s.date || s.createdAt)}
                            </span>
                            {s.metering && (
                              <span className="text-ink-400 shrink-0">{s.metering} m</span>
                            )}
                            <span className="text-ink-300 group-hover:text-ink-500 shrink-0 transition-colors">›</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}

            </div>

            {/* Right column: image gallery */}
            <div>
              {displayImages.length > 0 ? (
                <ImageCarousel images={displayImages} />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-ink-400 bg-page border border-border-soft rounded-lg">
                  <Image className="w-8 h-8 opacity-40" strokeWidth={1.5} />
                  <span className="text-sm">{selectedSurvey ? 'Nenhuma imagem neste levantamento' : t('detail.noImages')}</span>
                </div>
              )}
            </div>

          </div>

        </div>
      </Card>

      {/* Histórico de Atualizações — log automático */}
      <div className="mt-4">
        <Card>
          <div className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-ink-400 shrink-0" strokeWidth={1.75} />
              <span className="text-sm font-semibold text-ink-700">Histórico de Atualizações</span>
              {auditLogs.length > 0 && (
                <span className="text-[10px] font-bold text-brand-500 bg-brand-500/10 px-1.5 py-0.5 rounded-full">
                  {auditLogs.length}
                </span>
              )}
            </div>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-ink-400 italic">Nenhuma atualização registrada para este projeto.</p>
            ) : (
              <div className="flex flex-col divide-y divide-border-soft max-h-[320px] overflow-y-auto">
                {auditLogs.map((log, i) => {
                  // Format: "{user_name} {description}." with date/time on the right
                  const userName = log.user_name ?? 'Usuário'
                  const desc = log.description ?? (ACTION_LABELS[log.action] ?? log.action)
                  return (
                    <div key={log.id ?? i} className="py-2.5 flex items-start justify-between gap-3">
                      <p className="text-xs text-ink-700 leading-relaxed flex-1">
                        <span className="font-semibold">{userName}</span>
                        {' '}
                        {/* Lowercase first char of description to concatenate naturally */}
                        {desc ? desc.charAt(0).toLowerCase() + desc.slice(1) : ''}
                      </p>
                      <span className="text-[10px] text-ink-400 shrink-0 tabular-nums">
                        {new Date(log.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  )
}
