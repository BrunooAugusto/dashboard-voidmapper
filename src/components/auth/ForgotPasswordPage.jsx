import { useState } from 'react'
import { CheckCircle2, ArrowLeft } from 'lucide-react'
import AuthCard from './AuthCard'
import AuthInput from './AuthInput'
import AGALogo from '../AGALogo'
import { useLanguage } from '../../contexts/LanguageContext'

export default function ForgotPasswordPage({ onGoToLogin }) {
  const { t } = useLanguage()
  const [email, setEmail]         = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <AuthCard className="max-w-[440px] p-10">

      {/* Brand mark */}
      <div className="mb-8">
        <AGALogo size="md" variant="light" />
      </div>

      {submitted ? (

        /* Success state */
        <div className="flex flex-col items-center text-center gap-5">
          <div className="w-16 h-16 rounded-full bg-success-bg flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-success-fg" strokeWidth={1.5} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-ink-900 leading-tight">
              {t('auth.forgot.successTitle')}
            </h2>
            <p className="text-sm text-ink-500 mt-2 leading-relaxed">
              {t('auth.forgot.successMessage')}
              <br />
              {t('auth.forgot.successNote')}
            </p>
          </div>

          <button
            type="button"
            onClick={onGoToLogin}
            className="mt-1 h-[52px] w-full rounded-[10px] bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 active:bg-brand-700 transition-colors"
          >
            {t('auth.forgot.backButton')}
          </button>
        </div>

      ) : (

        /* Form state */
        <>
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-ink-900 leading-tight">{t('auth.forgot.title')}</h2>
            <p className="text-sm text-ink-500 mt-1.5">
              {t('auth.forgot.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <AuthInput
              label={t('auth.forgot.email')}
              type="email"
              placeholder={t('auth.forgot.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <button
              type="submit"
              className="mt-2 h-[52px] w-full rounded-[10px] bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 active:bg-brand-700 transition-colors"
            >
              {t('auth.forgot.submit')}
            </button>
          </form>

          <button
            type="button"
            onClick={onGoToLogin}
            className="mt-5 w-full flex items-center justify-center gap-1.5 text-sm text-ink-500 hover:text-ink-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
            {t('auth.forgot.backToLogin')}
          </button>
        </>

      )}

      <p className="text-xs text-ink-300 text-center mt-8">
        {t('auth.copyright', { year: new Date().getFullYear() })}
      </p>

    </AuthCard>
  )
}
