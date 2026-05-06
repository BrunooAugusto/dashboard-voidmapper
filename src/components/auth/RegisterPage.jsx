import { useState } from 'react'
import AuthCard from './AuthCard'
import AuthInput from './AuthInput'

export default function RegisterPage({ onRegister, onGoToLogin }) {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')

  function clearError() {
    if (error) setError('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }
    onRegister({ email, name })
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
        <h2 className="text-2xl font-bold text-ink-900 leading-tight">Criar sua conta</h2>
        <p className="text-sm text-ink-500 mt-1.5">Preencha os dados para começar.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthInput
          label="Nome"
          placeholder="Seu nome completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
        />
        <AuthInput
          label="Email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <AuthInput
          label="Senha"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => { setPassword(e.target.value); clearError() }}
          autoComplete="new-password"
          required
        />

        {/* Confirm password + inline error */}
        <div className="flex flex-col gap-1.5">
          <AuthInput
            label="Confirmar senha"
            type="password"
            placeholder="••••••••"
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
          className="mt-2 h-[52px] w-full rounded-[10px] bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 active:bg-brand-700 transition-colors"
        >
          Criar conta
        </button>
      </form>

      {/* Back to login */}
      <div className="mt-6 text-center">
        <span className="text-sm text-ink-500">Já tem uma conta? </span>
        <button
          type="button"
          onClick={onGoToLogin}
          className="text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors"
        >
          Entrar
        </button>
      </div>

      <p className="text-xs text-ink-300 text-center mt-6">
        © {new Date().getFullYear()} Void Mapper. Todos os direitos reservados.
      </p>

    </AuthCard>
  )
}
