import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Card from './Card'
import FormField from './FormField'
import FormInput from './FormInput'
import NumberStepper from './NumberStepper'
import StatusPicker from './StatusPicker'
import UploadZone from './UploadZone'
import { cn } from '../lib/cn'
import { createProject, uploadProjectImage } from '../services/projectService'
import { useLanguage } from '../contexts/LanguageContext'

const today = new Date().toISOString().split('T')[0]

const LEVELS = Array.from({ length: 19 }, (_, i) => i + 6)

const EMPTY_FORM = {
  projectName: '',
  date: today,
  surveys: 0,
  projectLength: '',
  fileName: '',
  level: '',
  statuses: ['success'],
  notes: '',
  projectLink: '',
}


export default function CreateProjectPage({ onBack }) {
  const { t } = useLanguage()
  const [form, setForm] = useState(EMPTY_FORM)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function set(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const newProject = await createProject({
        code:          form.projectName,
        date:          form.date,
        surveyCount:   Number(form.surveys),
        projectLength: form.projectLength ? parseFloat(form.projectLength) : null,
        fileName:      form.fileName    || null,
        statuses:      form.statuses.map(v => ({ variant: v })),
        notes:         form.notes       || null,
        projectUrl:    form.projectLink || null,
        level:         form.level       ? parseInt(form.level, 10) : null,
      })
      // Upload any selected images now that we have a project ID
      for (const file of files) {
        await uploadProjectImage(newProject.id, file)
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
        <span className="text-sm font-semibold text-ink-900">{t('form.newProject')}</span>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <div className="p-8 3xl:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 3xl:gap-10">

            {/* Left column: form fields */}
            <div className="flex flex-col gap-5">

              <FormField label={t('form.projectName')}>
                <FormInput
                  placeholder={t('form.placeholder')}
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
                  placeholder={t('form.placeholder')}
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
                  onChange={(v) => set('statuses', v)}
                />
              </FormField>

              <FormField label={t('form.notesCreate')}>
                <textarea
                  placeholder={t('form.placeholder')}
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-[10px] bg-input-bg border border-border-soft text-sm font-medium text-ink-900 placeholder:text-ink-400 outline-none focus:border-brand-300 focus:bg-surface transition-colors resize-none leading-relaxed"
                />
              </FormField>

              <FormField label={t('form.projectLink')}>
                <FormInput
                  type="url"
                  placeholder={t('form.urlPlaceholder')}
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

            {/* Right column: project images + measurement image */}
            <div className="flex flex-col gap-5">
              <UploadZone onFilesChange={setFiles} />
            </div>

          </div>
        </form>
      </Card>
    </>
  )
}
