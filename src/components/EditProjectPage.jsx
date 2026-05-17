import { useState, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'
import Card from './Card'
import FormField from './FormField'
import FormInput from './FormInput'
import NumberStepper from './NumberStepper'
import StatusPicker from './StatusPicker'
import ImageManager from './ImageManager'
import { cn } from '../lib/cn'
import { updateProject, uploadProjectImage, deleteProjectImage } from '../services/projectService'
import { useLanguage } from '../contexts/LanguageContext'

function parseDateToInput(str) {
  if (!str || str === '—') return ''
  // ISO datetime "2024-01-15T00:00:00.000Z" → take only the date part
  if (str.includes('T')) return str.split('T')[0]
  // Already "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  // pt-BR "DD/MM/YYYY"
  const parts = str.split('/')
  if (parts.length !== 3) return ''
  const [d, m, y] = parts
  if (!y || !m || !d) return ''
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

const LEVELS = Array.from({ length: 19 }, (_, i) => i + 6)

function buildInitialForm(project) {
  return {
    projectName:          project?.code              ?? '',
    date:                 parseDateToInput(project?.date ?? ''),
    surveys:              project?.surveyCount        ?? (typeof project?.surveys === 'number' ? project.surveys : 0),
    projectLength:        String(project?.projectLength ?? ''),
    fileName:             project?.fileName          ?? '',
    level:                project?.level             != null ? String(project.level) : '',
    statuses:             project?.statuses?.map(s => s.variant).filter(Boolean) ?? ['success'],
    notes:                project?.notes             ?? '',
    projectLink:          project?.projectUrl        ?? '',
    rehabilitationStatus: project?.rehabilitationStatus ?? '',
  }
}

function buildInitialImages(project) {
  return (project?.images ?? [])
    .map((img, i) => ({ id: img.id ?? i + 1, src: img.url ?? img.src ?? '' }))
    .filter(img => img.src)
}


export default function EditProjectPage({ project, onBack }) {
  const { t } = useLanguage()
  const [form, setForm] = useState(() => buildInitialForm(project))
  const [images, setImages] = useState(() => buildInitialImages(project))
  const initialImages = useRef(buildInitialImages(project)).current
  const [registerSurvey, setRegisterSurvey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function set(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!project?.id) return
    setLoading(true)
    setError(null)
    try {
      await updateProject(project.id, {
        code:                 form.projectName,
        date:                 form.date,
        surveyCount:          Number(form.surveys),
        projectLength:        form.projectLength ? parseFloat(form.projectLength) : null,
        fileName:             form.fileName    || null,
        statuses:             form.statuses.map(v => ({ variant: v })),
        notes:                form.notes       || null,
        projectUrl:           form.projectLink || null,
        level:                form.level       ? parseInt(form.level, 10) : null,
        rehabilitationStatus: form.rehabilitationStatus || null,
      }, { registerSurvey })

      // Delete images that were removed from the manager
      const removed = initialImages.filter(init => !images.find(img => img.id === init.id))
      for (const img of removed) {
        await deleteProjectImage(project.id, img.id)
      }

      // Upload new images (identified by presence of .file — blob from local picker)
      const newFiles = images.filter(img => img.file)
      for (const img of newFiles) {
        await uploadProjectImage(project.id, img.file)
      }

      onBack?.()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
          {t('form.back')}
        </button>
        <span className="text-ink-400 text-sm">/</span>
        <span className="text-sm font-semibold text-ink-900">{t('form.editProject')}</span>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <div className="p-8 3xl:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 3xl:gap-10">

            {/* Left column: form fields */}
            <div className="flex flex-col gap-5">

              <FormField label={t('form.projectName')}>
                <FormInput
                  value={form.projectName}
                  onChange={(e) => set('projectName', e.target.value)}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label={t('form.date')}>
                  <FormInput
                    type="date"
                    value={form.date}
                    onChange={(e) => set('date', e.target.value)}
                  />
                </FormField>
                <FormField label={t('form.surveyCount')}>
                  <NumberStepper
                    value={form.surveys}
                    onChange={(v) => set('surveys', v)}
                  />
                </FormField>
              </div>

              <FormField label={t('form.projectLength')}>
                <div className="relative">
                  <FormInput
                    type="number"
                    min="0"
                    placeholder={t('form.projectLengthPlaceholder')}
                    value={form.projectLength}
                    onChange={(e) => set('projectLength', e.target.value)}
                    className="pr-10"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-ink-400 pointer-events-none select-none">
                    m
                  </span>
                </div>
              </FormField>

              <FormField label={t('form.fileName')}>
                <FormInput
                  value={form.fileName}
                  onChange={(e) => set('fileName', e.target.value)}
                />
              </FormField>

              <FormField label="Nível do Projeto">
                <select
                  value={form.level}
                  onChange={(e) => set('level', e.target.value)}
                  className="w-full h-[44px] px-4 rounded-[10px] bg-input-bg border border-border-soft text-sm font-medium text-ink-900 outline-none focus:border-brand-300 focus:bg-surface transition-colors"
                >
                  <option value="">Sem nível</option>
                  {LEVELS.map(l => <option key={l} value={l}>Nível {l}</option>)}
                </select>
              </FormField>

              <FormField label={t('form.status')}>
                <StatusPicker
                  value={form.statuses}
                  onChange={(v) => {
                    setForm(prev => {
                      const hadWarning = prev.statuses.includes('warning')
                      const hasWarning = v.includes('warning')
                      // If warning was just removed, clear rehab status
                      const rehabilitationStatus = !hasWarning && hadWarning ? '' : prev.rehabilitationStatus
                      return { ...prev, statuses: v, rehabilitationStatus }
                    })
                  }}
                />
              </FormField>

              {/* Rehabilitation status — always visible */}
              <FormField label="Status da Reabilitação">
                <div className="grid grid-cols-2 gap-3">
                  {/* Em Reabilitação — yellow/warning */}
                  {(() => {
                    const active = form.rehabilitationStatus === 'in_progress'
                    return (
                      <button
                        type="button"
                        onClick={() => setForm(prev => {
                          if (active) {
                            // deselect: remove warning from statuses, clear rehab
                            return {
                              ...prev,
                              statuses: prev.statuses.filter(s => s !== 'warning'),
                              rehabilitationStatus: '',
                            }
                          }
                          return {
                            ...prev,
                            statuses: prev.statuses.includes('warning') ? prev.statuses : [...prev.statuses, 'warning'],
                            rehabilitationStatus: 'in_progress',
                          }
                        })}
                        className={cn(
                          'h-[52px] flex items-center gap-2 px-4 rounded-[10px] border text-sm font-medium transition-colors',
                          active
                            ? 'bg-warning-bg border-warning-fg/30 text-warning-fg'
                            : 'bg-input-bg border-border-soft text-ink-400 hover:bg-page',
                        )}
                      >
                        <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', active ? 'bg-warning-fg' : 'bg-ink-300')} />
                        Em Reabilitação
                      </button>
                    )
                  })()}

                  {/* Reabilitado — indigo/purple */}
                  {(() => {
                    const active = form.rehabilitationStatus === 'rehabilitated'
                    return (
                      <button
                        type="button"
                        onClick={() => setForm(prev => {
                          if (active) {
                            // deselect: clear rehab status
                            return { ...prev, rehabilitationStatus: '' }
                          }
                          return {
                            ...prev,
                            // remove 'warning' since this project is done rehabilitating
                            statuses: prev.statuses.filter(s => s !== 'warning'),
                            rehabilitationStatus: 'rehabilitated',
                          }
                        })}
                        className={cn(
                          'h-[52px] flex items-center gap-2 px-4 rounded-[10px] border text-sm font-medium transition-colors',
                          active
                            ? 'bg-[#EEF2FF] border-[#6366F1]/30 text-[#4F46E5]'
                            : 'bg-input-bg border-border-soft text-ink-400 hover:bg-page',
                        )}
                      >
                        <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', active ? 'bg-[#6366F1]' : 'bg-ink-300')} />
                        Reabilitado
                      </button>
                    )
                  })()}
                </div>
              </FormField>

              {/* Register as new survey toggle */}
              <FormField label="Registrar como novo levantamento?">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRegisterSurvey(false)}
                    className={cn(
                      'h-[52px] flex items-center justify-center gap-2 px-4 rounded-[10px] border text-sm font-medium transition-colors',
                      !registerSurvey
                        ? 'bg-surface border-brand-300 text-ink-900 ring-1 ring-brand-300'
                        : 'bg-input-bg border-border-soft text-ink-400 hover:bg-page',
                    )}
                  >
                    Não
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegisterSurvey(true)}
                    className={cn(
                      'h-[52px] flex items-center justify-center gap-2 px-4 rounded-[10px] border text-sm font-medium transition-colors',
                      registerSurvey
                        ? 'bg-surface border-brand-300 text-ink-900 ring-1 ring-brand-300'
                        : 'bg-input-bg border-border-soft text-ink-400 hover:bg-page',
                    )}
                  >
                    Sim
                  </button>
                </div>
              </FormField>

              <FormField label={t('form.notes')}>
                <textarea
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-[10px] bg-input-bg border border-border-soft text-sm font-medium text-ink-700 placeholder:text-ink-400 outline-none focus:border-brand-300 focus:bg-surface transition-colors resize-none leading-relaxed"
                />
              </FormField>

              <FormField label={t('form.projectLink')}>
                <FormInput
                  type="url"
                  value={form.projectLink}
                  onChange={(e) => set('projectLink', e.target.value)}
                />
              </FormField>

              {error && (
                <p className="text-sm text-danger-fg">{error}</p>
              )}

              {/* Action buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={onBack}
                  disabled={loading}
                  className="flex-1 h-[46px] rounded-[7px] border border-border text-sm font-medium text-ink-900 hover:bg-page transition-colors disabled:opacity-50"
                >
                  {t('form.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-[46px] rounded-[7px] bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : t('form.save')}
                </button>
              </div>
            </div>

            {/* Right column: project images */}
            <div className="flex flex-col gap-5">
              <ImageManager images={images} onChange={setImages} />
            </div>

          </div>
        </form>
      </Card>

    </>
  )
}
