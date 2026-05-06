import { useState } from 'react'
import {
  User,
  Monitor,
  Shield,
  Sun,
  Moon,
  Globe,
  Bell,
  Laptop,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Pencil,
} from 'lucide-react'
import Card from './Card'
import FormField from './FormField'
import FormInput from './FormInput'
import { cn } from '../lib/cn'

// ── Inline subcomponents ───────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3 pb-5 border-b border-border-soft mb-1">
      <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-5 h-5 text-brand-500" strokeWidth={1.75} />
      </div>
      <div>
        <h3 className="text-base font-semibold text-ink-900 leading-tight">{title}</h3>
        {description && (
          <p className="text-xs text-ink-500 mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0',
        checked ? 'bg-brand-500' : 'bg-border',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  )
}

function ChipGroup({ options, value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'h-9 px-4 rounded-lg text-sm font-medium transition-colors border inline-flex items-center gap-2',
            value === opt.value
              ? 'bg-brand-500 text-white border-brand-500'
              : 'bg-surface text-ink-700 border-border-soft hover:bg-page',
          )}
        >
          {opt.icon && <opt.icon className="w-4 h-4" strokeWidth={1.75} />}
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function PreferenceRow({ label, description, children, last = false }) {
  return (
    <div className={cn('flex flex-col gap-2.5 py-5', !last && 'border-b border-border-soft')}>
      <div>
        <span className="text-sm font-medium text-ink-900">{label}</span>
        {description && <p className="text-xs text-ink-400 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function SettingRow({ label, description, children, borderless = false }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-6 py-4',
        !borderless && 'border-b border-border-soft',
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-900">{label}</p>
        {description && <p className="text-xs text-ink-500 mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

const SESSION_DATA = [
  { id: 1, Device: Laptop,     name: 'MacBook Pro',  browser: 'Chrome 124', location: 'São Paulo, BR',        time: 'Ativo agora',    current: true  },
  { id: 2, Device: Smartphone, name: 'iPhone 15',    browser: 'Safari 17',  location: 'São Paulo, BR',        time: 'Há 2 horas',     current: false },
  { id: 3, Device: Laptop,     name: 'Windows PC',   browser: 'Edge 123',   location: 'Belo Horizonte, BR',   time: 'Há 1 dia',       current: false },
]

// ── Main component ─────────────────────────────────────────────────────────────

export default function SettingsPage({ user, onSave, onNavigate }) {
  // Profile fields
  const [profile, setProfile] = useState({
    name:     user.name,
    email:    user.email,
    role:     user.role,
    initials: user.initials,
  })

  // System preferences
  const [theme,         setTheme]         = useState('light')
  const [language,      setLanguage]      = useState('pt')
  const [notifications, setNotifications] = useState(true)

  // Security
  const [twoFactor,        setTwoFactor]        = useState(false)
  const [showPassword,     setShowPassword]     = useState(false)
  const [passwords,        setPasswords]        = useState({ current: '', next: '', confirm: '' })

  function setField(key, val) {
    setProfile((p) => ({ ...p, [key]: val }))
  }

  function handleSave(e) {
    e.preventDefault()
    onSave?.({ ...user, ...profile })
  }

  const previewInitials = profile.initials.trim() || '??'

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4">

      {/* ── Page header ── */}
      <div className="mb-2">
        <h2 className="text-[28px] font-semibold text-ink-900 leading-tight">Configurações</h2>
        <p className="text-sm text-ink-500 mt-1">
          Gerencie preferências, conta e aparência do sistema
        </p>
      </div>

      {/* ── 1. Profile card ── */}
      <Card>
        <div className="p-6 flex flex-col gap-4">
          <SectionHeader
            icon={User}
            title="Perfil"
            description="Informações exibidas no sidebar e nas páginas do sistema"
          />

          <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* Avatar column */}
            <div className="flex flex-col items-center gap-3 shrink-0 lg:pt-2">
              {user.avatarSrc ? (
                <img
                  src={user.avatarSrc}
                  alt="Avatar"
                  className="w-[88px] h-[88px] rounded-full object-cover"
                />
              ) : (
                <div className="w-[88px] h-[88px] rounded-full bg-ink-300 text-white flex items-center justify-center text-3xl font-bold leading-none select-none">
                  {previewInitials}
                </div>
              )}
              <button
                type="button"
                onClick={() => onNavigate?.('profile')}
                className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-border-soft text-xs font-medium text-ink-700 hover:bg-page transition-colors"
              >
                <Pencil className="w-3 h-3" strokeWidth={2} />
                Editar foto
              </button>
            </div>

            {/* Fields grid */}
            <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Nome">
                <FormInput
                  value={profile.name}
                  placeholder="Nome completo"
                  onChange={(e) => setField('name', e.target.value)}
                />
              </FormField>

              <FormField label="Email">
                <FormInput
                  type="email"
                  value={profile.email}
                  placeholder="seu@email.com"
                  onChange={(e) => setField('email', e.target.value)}
                />
              </FormField>

              <FormField label="Cargo / Função">
                <FormInput
                  value={profile.role}
                  placeholder="Ex: Engenheiro de Minas"
                  onChange={(e) => setField('role', e.target.value)}
                />
              </FormField>

              <FormField label="Iniciais do Avatar">
                <FormInput
                  value={profile.initials}
                  placeholder="Ex: BA"
                  maxLength={2}
                  onChange={(e) => setField('initials', e.target.value.toUpperCase())}
                />
              </FormField>
            </div>
          </div>
        </div>
      </Card>

      {/* ── 2. System preferences card ── */}
      <Card>
        <div className="p-6 flex flex-col gap-0">
          <SectionHeader
            icon={Monitor}
            title="Preferências do Sistema"
            description="Personalize a aparência e o comportamento do painel"
          />

          <PreferenceRow
            label="Tema"
            description="Define o esquema de cores do painel"
          >
            <ChipGroup
              value={theme}
              onChange={setTheme}
              options={[
                { value: 'light',  label: 'Claro',  icon: Sun     },
                { value: 'dark',   label: 'Escuro', icon: Moon    },
                { value: 'system', label: 'Sistema', icon: Monitor },
              ]}
            />
          </PreferenceRow>

          <PreferenceRow
            label="Idioma"
            description="Idioma exibido na interface"
          >
            <ChipGroup
              value={language}
              onChange={setLanguage}
              options={[
                { value: 'pt', label: 'Português', icon: Globe },
                { value: 'en', label: 'English',   icon: Globe },
              ]}
            />
          </PreferenceRow>

          <PreferenceRow
            label="Notificações"
            description="Receber alertas sobre levantamentos e status de projetos"
            last
          >
            <div className="flex items-center gap-3">
              <Toggle checked={notifications} onChange={setNotifications} />
              <span className="text-sm text-ink-500">
                {notifications ? 'Ativado' : 'Desativado'}
              </span>
            </div>
          </PreferenceRow>
        </div>
      </Card>

      {/* ── 3. Security card ── */}
      <Card>
        <div className="p-6 flex flex-col gap-0">
          <SectionHeader
            icon={Shield}
            title="Segurança"
            description="Gerencie senha, sessões e autenticação"
          />

          {/* Change password row */}
          <SettingRow
            label="Alterar Senha"
            description="Recomendado atualizar a senha periodicamente"
          >
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="h-8 px-4 flex items-center gap-1.5 rounded-lg border border-border-soft text-sm font-medium text-ink-700 hover:bg-page transition-colors"
            >
              {showPassword ? 'Cancelar' : 'Alterar'}
              {showPassword
                ? <ChevronUp  className="w-3.5 h-3.5" strokeWidth={2} />
                : <ChevronDown className="w-3.5 h-3.5" strokeWidth={2} />}
            </button>
          </SettingRow>

          {/* Expandable password form */}
          {showPassword && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-b border-border-soft">
              <FormField label="Senha atual">
                <FormInput
                  type="password"
                  value={passwords.current}
                  placeholder="••••••••"
                  onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                />
              </FormField>
              <FormField label="Nova senha">
                <FormInput
                  type="password"
                  value={passwords.next}
                  placeholder="••••••••"
                  onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
                />
              </FormField>
              <FormField label="Confirmar nova senha">
                <FormInput
                  type="password"
                  value={passwords.confirm}
                  placeholder="••••••••"
                  onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                />
              </FormField>
            </div>
          )}

          {/* Active sessions */}
          <SettingRow
            label="Sessões Ativas"
            description={`${SESSION_DATA.length} dispositivos conectados à sua conta`}
          >
            <span className="h-6 px-2.5 rounded-full bg-brand-50 text-brand-600 text-xs font-semibold inline-flex items-center">
              {SESSION_DATA.length} ativas
            </span>
          </SettingRow>

          {/* Session list */}
          <div className="flex flex-col gap-2 pb-4 border-b border-border-soft">
            {SESSION_DATA.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-page"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <s.Device className="w-4 h-4 text-ink-400 shrink-0" strokeWidth={1.75} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink-900 leading-none truncate">
                      {s.name} · {s.browser}
                    </p>
                    <p className="text-[11px] text-ink-500 mt-0.5 truncate">
                      {s.location} · {s.time}
                    </p>
                  </div>
                </div>
                {s.current ? (
                  <span className="text-[11px] font-semibold text-success-fg bg-success-bg px-2 py-0.5 rounded-full shrink-0">
                    Este dispositivo
                  </span>
                ) : (
                  <button
                    type="button"
                    className="text-[11px] font-medium text-ink-400 hover:text-danger-fg transition-colors shrink-0"
                  >
                    Encerrar
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* 2FA */}
          <div className="pt-4">
            <div className="flex items-center justify-between gap-6">
              <div>
                <p className="text-sm font-medium text-ink-900">
                  Autenticação em Duas Etapas (2FA)
                </p>
                <p className="text-xs text-ink-500 mt-0.5">
                  Adicione uma camada extra de proteção à sua conta
                </p>
              </div>
              <Toggle checked={twoFactor} onChange={setTwoFactor} />
            </div>
            {twoFactor && (
              <p className="text-xs font-medium text-success-fg mt-3">
                2FA ativo — sua conta está protegida com verificação adicional.
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* ── Actions ── */}
      <div className="flex gap-3 pb-4">
        <button
          type="button"
          onClick={() => onNavigate?.('dashboard')}
          className="flex-1 sm:flex-none sm:w-36 h-[46px] rounded-[7px] border border-border text-sm font-medium text-ink-900 hover:bg-page transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 sm:flex-none sm:w-48 h-[46px] rounded-[7px] bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          Salvar Alterações
        </button>
      </div>

    </form>
  )
}
