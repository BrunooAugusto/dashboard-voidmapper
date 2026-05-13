import { useState } from 'react'
import AuthCard from './AuthCard'
import AuthInput from './AuthInput'
import AGALogo from '../AGALogo'
import { useLanguage } from '../../contexts/LanguageContext'

export default function RegisterPage({ onRegister, onGoToLogin }) {
  const { t } = useLanguage()
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  function clearError() {
    if (error) setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) {
      setError(t('auth.register.passwordMismatch'))
      return
    }
    setError('')
    setLoading(true)
    try {
      await onRegister({ email, name, password })
    } catch (err) {
      setError(err.message || 'Falha no cadastro')
      setLoading(false)
    }
  }

  return (
    <AuthCard className="max-w-[440px] p-10">

      {/* Brand mark */}
      <div className="mb-8">
        <AGALogo size="md" variant="light" />
      </div>

      {/* Heading */}
      <div className="mb-7">
        <h2 className="text-2xl font-bold text-ink-900 leading-tight">{t('auth.register.title')}</h2>
        <p className="text-sm text-ink-500 mt-1.5">{t('auth.register.subtitle')}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthInput
          label={t('auth.register.name')}
          placeholder={t('auth.register.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
        />
        <AuthInput
          label={t('auth.register.email')}
          type="email"
          placeholder={t('auth.register.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <AuthInput
          label={t('auth.register.password')}
          type="password"
          placeholder={t('auth.register.passwordPlaceholder')}
          value={password}
          onChange={(e) => { setPassword(e.target.value); clearError() }}
          autoComplete="new-password"
          required
        />

        <div className="flex flex-col gap-1.5">
          <AuthInput
            label={t('auth.register.confirmPassword')}
            type="password"
            placeholder={t('auth.register.passwordPlaceholder')}
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); clearError() }}
            autoComplete="new-password"
            required
          />
          {error && (
            <p className="text-xs font-medium text-danger-fg pl-0.5">{error}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 h-[52px] w-full rounded-[10px] bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 active:bg-brand-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? '...' : t('auth.register.submit')}
        </button>
      </form>

      {/* Back to login */}
      <div className="mt-6 text-center">
        <span className="text-sm text-ink-500">{t('auth.register.hasAccount')} </span>
        <button
          type="button"
          onClick={onGoToLogin}
          className="text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors"
        >
          {t('auth.register.signIn')}
        </button>
      </div>

      <p className="text-xs text-ink-300 text-center mt-6">
        {t('auth.copyright', { year: new Date().getFullYear() })}
      </p>

    </AuthCard>
  )
}
