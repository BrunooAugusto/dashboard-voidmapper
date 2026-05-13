import { useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import AuthCard from './AuthCard'
import AuthInput from './AuthInput'
import { useLanguage } from '../../contexts/LanguageContext'

export default function ProfileSetupPage({ initialEmail = '', onComplete }) {
  const { t } = useLanguage()
  const [form, setForm] = useState({
    name:     '',
    email:    initialEmail,
    role:     '',
    initials: '',
  })
  const [avatarSrc, setAvatarSrc] = useState(null)
  const fileRef = useRef(null)

  function set(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (file) setAvatarSrc(URL.createObjectURL(file))
    e.target.value = ''
  }

  const autoInitials = form.name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const previewInitials = form.initials.trim() || autoInitials || '??'

  function handleSubmit(e) {
    e.preventDefault()
    onComplete({ ...form, initials: previewInitials, avatarSrc })
  }

  return (
    <AuthCard className="max-w-[560px] p-8">

      {/* Brand mark */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center shrink-0">
          <span className="text-white text-sm font-black leading-none select-none">V</span>
        </div>
        <span className="text-base font-bold tracking-tight text-ink-900">
          Void <span className="text-brand-500">Mapper</span>
        </span>
      </div>

      {/* Heading */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-ink-900 leading-tight">
          {t('auth.setup.title')}
        </h2>
        <p className="text-sm text-ink-500 mt-1.5">
          {t('auth.setup.subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Avatar row */}
        <div className="flex items-center gap-4">
          <div className="relative group shrink-0">
            <div className="w-[72px] h-[72px] rounded-full bg-ink-300 flex items-center justify-center overflow-hidden select-none">
              {avatarSrc ? (
                <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-xl font-bold leading-none">
                  {previewInitials}
                </span>
              )}
            </div>
            <button
              type="button"
              title={t('auth.setup.addPhoto')}
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <Camera className="w-5 h-5 text-white" strokeWidth={1.75} />
            </button>
          </div>

          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors"
            >
              {t('auth.setup.addPhoto')}
            </button>
            <p className="text-xs text-ink-400 mt-0.5">{t('auth.setup.photoHint')}</p>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        <div className="h-px bg-border-soft" />

        {/* Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AuthInput
            label={t('auth.setup.name')}
            placeholder={t('auth.setup.namePlaceholder')}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            required
          />
          <AuthInput
            label={t('auth.setup.email')}
            type="email"
            placeholder={t('auth.setup.emailPlaceholder')}
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            required
          />
          <AuthInput
            label={t('auth.setup.role')}
            placeholder={t('auth.setup.rolePlaceholder')}
            value={form.role}
            onChange={(e) => set('role', e.target.value)}
            required
          />
          <AuthInput
            label={t('auth.setup.initials')}
            placeholder={t('auth.setup.initialsPlaceholder')}
            value={form.initials}
            maxLength={2}
            onChange={(e) => set('initials', e.target.value.toUpperCase())}
          />
        </div>

        <button
          type="submit"
          className="h-[52px] w-full rounded-[10px] bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 active:bg-brand-700 transition-colors"
        >
          {t('auth.setup.submit')}
        </button>

      </form>
    </AuthCard>
  )
}
