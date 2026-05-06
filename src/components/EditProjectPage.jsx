import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Card from './Card'
import FormField from './FormField'
import FormInput from './FormInput'
import NumberStepper from './NumberStepper'
import StatusPicker from './StatusPicker'
import ImageManager from './ImageManager'
import { PROJECT_DETAIL } from '../data/dashboard'
import { useLanguage } from '../contexts/LanguageContext'

function parseDateToInput(str) {
  if (!str) return ''
  if (str.includes('-')) return str
  const [d, m, y] = str.split('/')
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

function buildInitialForm(project) {
  return {
    projectName: project?.code ?? PROJECT_DETAIL.code,
    date: parseDateToInput(project?.date ?? PROJECT_DETAIL.lastSurvey),
    surveys: project?.surveys ?? PROJECT_DETAIL.surveys,
    fileName: PROJECT_DETAIL.file,
    status: project?.statuses?.[0]?.variant ?? PROJECT_DETAIL.status.variant,
    notes: PROJECT_DETAIL.notes,
    projectLink: PROJECT_DETAIL.projectUrl,
  }
}

function buildInitialImages() {
  return [
    { id: 1, src: PROJECT_DETAIL.mainImage },
    { id: 2, src: PROJECT_DETAIL.thumbnails[0] },
    { id: 3, src: PROJECT_DETAIL.thumbnails[1] },
  ]
}

export default function EditProjectPage({ project, onBack }) {
  const { t } = useLanguage()
  const [form, setForm] = useState(() => buildInitialForm(project))
  const [images, setImages] = useState(buildInitialImages)

  function set(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    console.log('Projeto atualizado:', { ...form, images })
    onBack?.()
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
          <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">

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

              <FormField label={t('form.fileName')}>
                <FormInput
                  value={form.fileName}
                  onChange={(e) => set('fileName', e.target.value)}
                />
              </FormField>

              <FormField label={t('form.status')}>
                <StatusPicker
                  value={form.status}
                  onChange={(v) => set('status', v)}
                />
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

              {/* Action buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={onBack}
                  className="flex-1 h-[46px] rounded-[7px] border border-border text-sm font-medium text-ink-900 hover:bg-page transition-colors"
                >
                  {t('form.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 h-[46px] rounded-[7px] bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
                >
                  {t('form.save')}
                </button>
              </div>
            </div>

            {/* Right column: image manager */}
            <ImageManager images={images} onChange={setImages} />
          </div>
        </form>
      </Card>
    </>
  )
}
