import { useState } from 'react'
import AuthCard from './AuthCard'
import AuthInput from './AuthInput'
import AGALogo from '../AGALogo'
import { useLanguage } from '../../contexts/LanguageContext'

export default function LoginPage({ onLogin, onGoToRegister, onGoToForgotPassword }) {
  const { t } = useLanguage()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onLogin({ email, password })
    } catch (err) {
      setError(err.message || 'Falha no login')
    } finally {
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
        <h2 className="text-2xl font-bold text-ink-900 leading-tight">
          {t('auth.login.title')}
        </h2>
        <p className="text-sm text-ink-500 mt-1.5">
          {t('auth.login.subtitle')}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthInput
          label={t('auth.login.email')}
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <div className="flex flex-col gap-1.5">
          <AuthInput
            label={t('auth.login.password')}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onGoToForgotPassword}
              className="text-xs text-ink-500 hover:text-brand-500 transition-colors"
            >
              {t('auth.login.forgot')}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-xs font-medium text-danger-fg pl-0.5">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 h-[52px] w-full rounded-[10px] bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 active:bg-brand-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? '...' : t('auth.login.submit')}
        </button>
      </form>

      {/* Divider */}
      <div className="mt-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-border-soft" />
        <span className="text-xs text-ink-400 shrink-0">{t('auth.login.or')}</span>
        <div className="flex-1 h-px bg-border-soft" />
      </div>

      {/* Register link */}
      <div className="mt-5 text-center">
        <span className="text-sm text-ink-500">{t('auth.login.noAccount')} </span>
        <button
          type="button"
          onClick={onGoToRegister}
          className="text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors"
        >
          {t('auth.login.createAccount')}
        </button>
      </div>

      <p className="text-xs text-ink-300 text-center mt-6">
        {t('auth.copyright', { year: new Date().getFullYear() })}
      </p>

    </AuthCard>
  )
}
