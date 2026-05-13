import { useState, useRef } from 'react'
import { ArrowLeft, Camera, ImagePlus } from 'lucide-react'
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
  if (!str) return ''
  if (str.includes('-')) return str
  const [d, m, y] = str.split('/')
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

function buildInitialForm(project) {
  return {
    projectName:   project?.code              ?? '',
    date:          parseDateToInput(project?.date ?? ''),
    surveys:       project?.surveys           ?? project?.surveyCount ?? 0,
    projectLength: String(project?.projectLength ?? ''),
    fileName:      project?.fileName          ?? '',
    status:        project?.statuses?.[0]?.variant ?? 'success',
    notes:         project?.notes             ?? '',
    projectLink:   project?.projectUrl        ?? '',
  }
}

function buildInitialImages(project) {
  return (project?.images ?? [])
    .map((img, i) => ({ id: img.id ?? i + 1, src: img.url ?? img.src ?? '' }))
    .filter(img => img.src)
}

function MeasurementImageSlot({ src, onChange }) {
  const inputRef = useRef(null)
  const { t } = useLanguage()

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (file) onChange(URL.createObjectURL(file))
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-ink-900">{t('form.measurementImage')}</span>
      <div
        className={cn(
          'relative group rounded-xl overflow-hidden aspect-[16/9]',
          src ? 'bg-zinc-900' : 'bg-input-bg border-2 border-dashed border-border',
        )}
      >
        {src ? (
          <>
            <img src={src} alt="Metragem" className="w-full h-full object-contain" />
            <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                title={t('form.changeMeasurementImage')}
                onClick={() => inputRef.current?.click()}
                className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white hover:bg-brand-600 transition-colors"
              >
                <Camera className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            <span className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-white/70 pointer-events-none">
              {t('form.changeMeasurementImage')}
            </span>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full h-full flex flex-col items-center justify-center gap-2 text-ink-400 hover:text-brand-500 transition-colors"
          >
            <ImagePlus className="w-5 h-5" strokeWidth={1.75} />
            <span className="text-xs font-medium">{t('form.addMeasurementImage')}</span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}

export default function EditProjectPage({ project, onBack }) {
  const { t } = useLanguage()
  const [form, setForm] = useState(() => buildInitialForm(project))
  const [images, setImages] = useState(() => buildInitialImages(project))
  const initialImages = useRef(buildInitialImages(project)).current
  const [measurementSrc, setMeasurementSrc] = useState(null)
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
        code:          form.projectName,
        date:          form.date,
        surveyCount:   Number(form.surveys),
        projectLength: form.projectLength ? parseFloat(form.projectLength) : null,
        fileName:      form.fileName    || null,
        statuses:      [{ variant: form.status }],
        notes:         form.notes       || null,
        projectUrl:    form.projectLink || null,
      })

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
              <ImageManager images={images} onChange={setImages} />
              <MeasurementImageSlot src={measurementSrc} onChange={setMeasurementSrc} />
            </div>

          </div>
        </form>
      </Card>
    </>
  )
}
