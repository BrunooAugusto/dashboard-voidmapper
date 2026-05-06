import { useState } from 'react'
import AuthCard from './AuthCard'
import AuthInput from './AuthInput'

export default function LoginPage({ onLogin, onGoToRegister, onGoToForgotPassword }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    onLogin({ email })
  }

  return (
    <AuthCard className="max-w-[440px] p-10">

      {/* Brand mark */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center shrink-0">
          <span className="text-white text-base font-black leading-none select-none">V</span>
        </div>
        <span className="text-xl font-bold tracking-tight text-ink-900">
          Void <span className="text-brand-500">Mapper</span>
        </span>
      </div>

      {/* Heading */}
      <div className="mb-7">
        <h2 className="text-2xl font-bold text-ink-900 leading-tight">
          Bem-vindo de volta.
        </h2>
        <p className="text-sm text-ink-500 mt-1.5">
          Insira suas credenciais para continuar.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthInput
          label="Email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        {/* Password + forgot link */}
        <div className="flex flex-col gap-1.5">
          <AuthInput
            label="Senha"
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
              Esqueci minha senha
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="mt-1 h-[52px] w-full rounded-[10px] bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 active:bg-brand-700 transition-colors"
        >
          Entrar
        </button>
      </form>

      {/* Divider */}
      <div className="mt-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-border-soft" />
        <span className="text-xs text-ink-400 shrink-0">ou</span>
        <div className="flex-1 h-px bg-border-soft" />
      </div>

      {/* Register link */}
      <div className="mt-5 text-center">
        <span className="text-sm text-ink-500">Não tem uma conta? </span>
        <button
          type="button"
          onClick={onGoToRegister}
          className="text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors"
        >
          Criar conta
        </button>
      </div>

      <p className="text-xs text-ink-300 text-center mt-6">
        © {new Date().getFullYear()} Void Mapper. Todos os direitos reservados.
      </p>

    </AuthCard>
  )
}
