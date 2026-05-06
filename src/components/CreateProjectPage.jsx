import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Card from './Card'
import FormField from './FormField'
import FormInput from './FormInput'
import NumberStepper from './NumberStepper'
import StatusPicker from './StatusPicker'
import UploadZone from './UploadZone'
import { useLanguage } from '../contexts/LanguageContext'

const today = new Date().toISOString().split('T')[0]

const EMPTY_FORM = {
  projectName: '',
  date: today,
  surveys: 0,
  fileName: '',
  status: 'success',
  notes: '',
  projectLink: '',
}

export default function CreateProjectPage({ onBack, onSave }) {
  const { t } = useLanguage()
  const [form, setForm] = useState(EMPTY_FORM)
  const [files, setFiles] = useState([])

  function set(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const payload = { ...form, files }
    console.log('Novo projeto:', payload)
    onSave?.(payload)
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
        <span className="text-sm font-semibold text-ink-900">{t('form.newProject')}</span>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">

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

              <FormField label={t('form.fileName')}>
                <FormInput
                  placeholder={t('form.placeholder')}
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

            {/* Right column: upload zone */}
            <UploadZone files={files} onFilesChange={setFiles} />
          </div>
        </form>
      </Card>
    </>
  )
}
