import { useRef, useState } from 'react'
import { ArrowLeft, Camera, X, ImagePlus } from 'lucide-react'
import Card from './Card'
import FormField from './FormField'
import FormInput from './FormInput'
import Avatar from './Avatar'
import { updateProfile } from '../services/authService'
import { useLanguage } from '../contexts/LanguageContext'

export default function ProfileEditPage({ user, onSave, onBack }) {
  const { t } = useLanguage()
  const [form, setForm] = useState({
    name: user.name,
    role: user.role,
    email: user.email,
    initials: user.initials,
  })
  const [avatarSrc, setAvatarSrc] = useState(user.avatarSrc ?? null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const fileInputRef = useRef(null)

  function set(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (file) setAvatarSrc(URL.createObjectURL(file))
    e.target.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await updateProfile({ name: form.name, role: form.role, initials: form.initials.trim() || previewInitials })
      onSave?.({ ...form, avatarSrc })
      onBack?.()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const previewInitials = form.initials.trim() || '??'

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
          {t('profile.back')}
        </button>
        <span className="text-ink-400 text-sm">/</span>
        <span className="text-sm font-semibold text-ink-900">{t('profile.breadcrumb')}</span>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <div className="p-8 3xl:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 3xl:gap-10">

            {/* Left column: form fields */}
            <div className="flex flex-col gap-5">

              <FormField label={t('profile.name')}>
                <FormInput
                  value={form.name}
                  placeholder={t('profile.namePlaceholder')}
                  onChange={(e) => set('name', e.target.value)}
                />
              </FormField>

              <FormField label={t('profile.role')}>
                <FormInput
                  value={form.role}
                  placeholder={t('profile.rolePlaceholder')}
                  onChange={(e) => set('role', e.target.value)}
                />
              </FormField>

              <FormField label={t('profile.email')}>
                <FormInput
                  type="email"
                  value={form.email}
                  placeholder={t('profile.emailPlaceholder')}
                  onChange={(e) => set('email', e.target.value)}
                />
              </FormField>

              <FormField label={t('profile.initials')}>
                <FormInput
                  value={form.initials}
                  placeholder={t('profile.initialsPlaceholder')}
                  maxLength={2}
                  onChange={(e) => set('initials', e.target.value.toUpperCase())}
                />
                <p className="text-xs text-ink-400 -mt-1">
                  {t('profile.initialsHint')}
                </p>
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
                  {t('profile.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-[46px] rounded-[7px] bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : t('profile.save')}
                </button>
              </div>
            </div>

            {/* Right column: avatar preview + upload */}
            <div className="flex flex-col items-center gap-6">

              <div className="w-full">
                <p className="text-sm font-medium text-ink-900 mb-4">{t('profile.preview')}</p>

                {/* Sidebar card preview */}
                <div className="h-[65px] px-3 flex items-center gap-3 rounded-xl border border-border-soft bg-surface w-full max-w-[300px]">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-ink-300 text-white flex items-center justify-center text-sm font-semibold shrink-0 leading-none">
                      {previewInitials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-ink-900 truncate leading-5">
                      {form.name || t('profile.namePlaceholder')}
                    </div>
                    <div className="text-xs text-ink-500 truncate leading-[15px] mt-0.5">
                      {form.role || t('profile.rolePlaceholder')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Large avatar with camera overlay */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative group">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt="Avatar"
                      className="w-[120px] h-[120px] rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-[120px] h-[120px] rounded-full bg-ink-300 text-white flex items-center justify-center text-4xl font-bold leading-none select-none">
                      {previewInitials}
                    </div>
                  )}

                  <button
                    type="button"
                    title={t('profile.changePhoto')}
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <Camera className="w-7 h-7 text-white" strokeWidth={1.75} />
                  </button>
                </div>

                {avatarSrc && (
                  <button
                    type="button"
                    onClick={() => setAvatarSrc(null)}
                    className="flex items-center gap-1 text-xs text-ink-400 hover:text-danger-fg transition-colors"
                  >
                    <X className="w-3 h-3" strokeWidth={2} />
                    {t('profile.removePhoto')}
                  </button>
                )}
              </div>

              {/* Upload drop zone */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 text-ink-400 hover:border-brand-400 hover:text-brand-500 hover:bg-brand-500/10 transition-all duration-200 cursor-pointer"
              >
                <ImagePlus className="w-6 h-6" strokeWidth={1.75} />
                <span className="text-sm font-medium">{t('profile.changePhoto')}</span>
                <span className="text-xs">{t('profile.photoFormats')}</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
          </div>
        </form>
      </Card>
    </>
  )
}
