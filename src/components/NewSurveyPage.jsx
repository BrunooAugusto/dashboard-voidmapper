import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Card from './Card'
import FormField from './FormField'
import FormInput from './FormInput'
import StatusPicker from './StatusPicker'
import UploadZone from './UploadZone'
import { addSurveyToProject, uploadSurveyImage } from '../services/projectService'
import { useLanguage } from '../contexts/LanguageContext'

const today = new Date().toISOString().split('T')[0]

export default function NewSurveyPage({ project, onBack }) {
  const { t } = useLanguage()
  const [form, setForm] = useState({
    date: today,
    metering: '',
    fileName: project?.fileName ?? '',
    statuses: project?.statuses?.map(s => s.variant).filter(Boolean) ?? ['success'],
    observations: '',
  })
  const [files, setFiles]     = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  function set(key, val) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!project?.id) return
    setLoading(true)
    setError(null)
    try {
      const survey = await addSurveyToProject(project.id, {
        date:         form.date,
        metering:     form.metering || null,
        file:         form.fileName || null,
        status:       form.statuses[0] || null,
        observations: form.observations || null,
      })

      // Upload images linked to this specific survey
      for (const file of files) {
        await uploadSurveyImage(project.id, survey.id, file)
      }

      onBack?.()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const code = project?.code ?? '—'

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
          {code}
        </button>
        <span className="text-ink-400 text-sm">/</span>
        <span className="text-sm font-semibold text-ink-900">{t('survey.newSurvey')}</span>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <div className="p-8 3xl:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 3xl:gap-10">

            {/* Left column: fields */}
            <div className="flex flex-col gap-5">

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-4">
                  {t('survey.dataTitle')}
                </p>
              </div>

              <FormField label={t('survey.fileName')}>
                <FormInput
                  placeholder="PROJETO_20260620.laz"
                  value={form.fileName}
                  onChange={e => set('fileName', e.target.value)}
                />
                {form.fileName && (() => {
                  const lower = form.fileName.toLowerCase()
                  const isLtc = lower.includes('ltc')
                  const isStc = lower.includes('stc')
                  if (isLtc || isStc) {
                    return (
                      <p className="mt-1.5 text-[11px] font-medium text-warning-fg">
                        {t('survey.ltcStcWarning', { type: isLtc ? 'LTC' : 'STC' })}
                      </p>
                    )
                  }
                  return null
                })()}
              </FormField>

              <FormField label={t('survey.date')}>
                <FormInput
                  type="date"
                  value={form.date}
                  onChange={e => set('date', e.target.value)}
                />
              </FormField>

              <FormField label={t('survey.metering')}>
                <div className="relative">
                  <FormInput
                    type="number"
                    min="0"
                    placeholder="Ex: 296"
                    value={form.metering}
                    onChange={e => set('metering', e.target.value)}
                    className="pr-10"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-ink-400 pointer-events-none select-none">
                    m
                  </span>
                </div>
              </FormField>

              <FormField label={t('survey.status')}>
                <StatusPicker
                  value={form.statuses}
                  onChange={v => set('statuses', v)}
                />
              </FormField>

              <FormField label={t('survey.observations')}>
                <textarea
                  placeholder={t('form.placeholder')}
                  value={form.observations}
                  onChange={e => set('observations', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-[10px] bg-input-bg border border-border-soft text-sm font-medium text-ink-900 placeholder:text-ink-400 outline-none focus:border-brand-300 focus:bg-surface transition-colors resize-none leading-relaxed"
                />
              </FormField>

              {error && (
                <p className="text-sm text-danger-fg">{error}</p>
              )}

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
                  {loading ? 'Salvando...' : t('survey.save')}
                </button>
              </div>
            </div>

            {/* Right column: images */}
            <div className="flex flex-col gap-6">
              <UploadZone onFilesChange={setFiles} />
            </div>

          </div>
        </form>
      </Card>
    </>
  )
}
