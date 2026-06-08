import { useState } from 'react'
import {
  User, Monitor, Shield, Sun, Moon, Globe, Bell,
  ChevronDown, ChevronUp, Pencil, LogOut
} from 'lucide-react'
import Card from './Card'
import FormField from './FormField'
import FormInput from './FormInput'
import { cn } from '../lib/cn'
import { updateProfile, changePassword } from '../services/authService'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'

// ── Subcomponents ──────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3 pb-5 border-b border-border-soft mb-1">
      <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0 mt-0.5">
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
          'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200',
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


// ── Main component ─────────────────────────────────────────────────────────────

export default function SettingsPage({ user, onSave, onNavigate, onLogout }) {
  const { theme, setTheme } = useTheme()
  const { lang, setLang, t } = useLanguage()

  const [profile, setProfile] = useState({
    name:     user.name,
    email:    user.email,
    role:     user.role,
    initials: user.initials,
  })
  const [notifications,  setNotifications]  = useState(true)
  const [showPassword,   setShowPassword]   = useState(false)
  const [passwords,      setPasswords]      = useState({ current: '', next: '', confirm: '' })
  const [pwLoading,      setPwLoading]      = useState(false)
  const [pwError,        setPwError]        = useState(null)
  const [pwSuccess,      setPwSuccess]      = useState(false)

  function setField(key, val) {
    setProfile((p) => ({ ...p, [key]: val }))
  }

  async function handleChangePassword() {
    setPwError(null)
    setPwSuccess(false)
    if (!passwords.current || !passwords.next) { setPwError('Preencha todos os campos.'); return }
    if (passwords.next !== passwords.confirm)   { setPwError('As senhas não coincidem.'); return }
    if (passwords.next.length < 6)              { setPwError('Nova senha deve ter ao menos 6 caracteres.'); return }
    setPwLoading(true)
    try {
      await changePassword({ currentPassword: passwords.current, newPassword: passwords.next })
      setPasswords({ current: '', next: '', confirm: '' })
      setShowPassword(false)
      setPwSuccess(true)
      setTimeout(() => setPwSuccess(false), 3000)
    } catch (err) {
      setPwError(err.message)
    } finally {
      setPwLoading(false)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    try {
      await updateProfile({ name: profile.name, role: profile.role, initials: profile.initials })
    } catch { /* silently fall through — localStorage still updated */ }
    onSave?.({ ...user, ...profile })
  }

  const previewInitials = profile.initials.trim() || '??'

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4">

      {/* Page header */}
      <div className="mb-2">
        <h2 className="text-[28px] font-semibold text-ink-900 leading-tight">{t('settings.title')}</h2>
        <p className="text-sm text-ink-500 mt-1">{t('settings.subtitle')}</p>
      </div>

      {/* 1. Profile card */}
      <Card>
        <div className="p-6 flex flex-col gap-4">
          <SectionHeader
            icon={User}
            title={t('settings.profile.section')}
            description={t('settings.profile.description')}
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
                {t('settings.profile.editPhoto')}
              </button>
            </div>

            {/* Fields grid */}
            <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 4xl:grid-cols-4 gap-4 3xl:gap-5">
              <FormField label={t('settings.profile.name')}>
                <FormInput
                  value={profile.name}
                  placeholder={t('settings.profile.namePlaceholder')}
                  onChange={(e) => setField('name', e.target.value)}
                />
              </FormField>

              <FormField label={t('settings.profile.email')}>
                <FormInput
                  type="email"
                  value={profile.email}
                  placeholder={t('settings.profile.emailPlaceholder')}
                  onChange={(e) => setField('email', e.target.value)}
                />
              </FormField>

              <FormField label={t('settings.profile.role')}>
                <FormInput
                  value={profile.role}
                  placeholder={t('settings.profile.rolePlaceholder')}
                  onChange={(e) => setField('role', e.target.value)}
                />
              </FormField>

              <FormField label={t('settings.profile.initials')}>
                <FormInput
                  value={profile.initials}
                  placeholder={t('settings.profile.initialsPlaceholder')}
                  maxLength={2}
                  onChange={(e) => setField('initials', e.target.value.toUpperCase())}
                />
              </FormField>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. System preferences card */}
      <Card>
        <div className="p-6 flex flex-col gap-0">
          <SectionHeader
            icon={Monitor}
            title={t('settings.system.section')}
            description={t('settings.system.description')}
          />

          <PreferenceRow
            label={t('settings.system.theme')}
            description={t('settings.system.themeDescription')}
          >
            <ChipGroup
              value={theme}
              onChange={setTheme}
              options={[
                { value: 'light',  label: t('settings.system.themeLight'),  icon: Sun     },
                { value: 'dark',   label: t('settings.system.themeDark'),   icon: Moon    },
              ]}
            />
          </PreferenceRow>

          <PreferenceRow
            label={t('settings.system.language')}
            description={t('settings.system.langDescription')}
          >
            <ChipGroup
              value={lang}
              onChange={setLang}
              options={[
                { value: 'pt-BR', label: t('settings.system.langPT'), icon: Globe },
                { value: 'en',    label: t('settings.system.langEN'), icon: Globe },
              ]}
            />
          </PreferenceRow>

          <PreferenceRow
            label={t('settings.system.notifications')}
            description={t('settings.system.notifDescription')}
            last
          >
            <div className="flex items-center gap-3">
              <Toggle checked={notifications} onChange={setNotifications} />
              <span className="text-sm text-ink-500">
                {notifications ? t('settings.system.notifOn') : t('settings.system.notifOff')}
              </span>
            </div>
          </PreferenceRow>
        </div>
      </Card>

      {/* 3. Security card */}
      <Card>
        <div className="p-6 flex flex-col gap-0">
          <SectionHeader
            icon={Shield}
            title={t('settings.security.section')}
            description={t('settings.security.description')}
          />

          {/* Change password row */}
          <SettingRow
            label={t('settings.security.changePassword')}
            description={t('settings.security.changePassDesc')}
          >
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="h-8 px-4 flex items-center gap-1.5 rounded-lg border border-border-soft text-sm font-medium text-ink-700 hover:bg-page transition-colors"
            >
              {showPassword ? t('settings.security.cancel') : t('settings.security.change')}
              {showPassword
                ? <ChevronUp   className="w-3.5 h-3.5" strokeWidth={2} />
                : <ChevronDown className="w-3.5 h-3.5" strokeWidth={2} />}
            </button>
          </SettingRow>

          {showPassword && (
            <div className="py-4 border-b border-border-soft flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 3xl:gap-5">
                <FormField label={t('settings.security.currentPassword')}>
                  <FormInput
                    type="password"
                    value={passwords.current}
                    placeholder="••••••••"
                    onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                  />
                </FormField>
                <FormField label={t('settings.security.newPassword')}>
                  <FormInput
                    type="password"
                    value={passwords.next}
                    placeholder="••••••••"
                    onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
                  />
                </FormField>
                <FormField label={t('settings.security.confirmPassword')}>
                  <FormInput
                    type="password"
                    value={passwords.confirm}
                    placeholder="••••••••"
                    onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                  />
                </FormField>
              </div>
              {pwError   && <p className="text-xs font-medium text-danger-fg">{pwError}</p>}
              {pwSuccess && <p className="text-xs font-medium text-success-fg">✓ Senha alterada com sucesso</p>}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={pwLoading}
                  className="h-9 px-5 rounded-full bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
                >
                  {pwLoading ? '...' : t('settings.security.changePassword')}
                </button>
              </div>
            </div>
          )}

        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pb-4">
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="h-[46px] px-5 rounded-[7px] border border-border text-sm font-medium text-danger-fg hover:bg-danger-bg transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.75} />
            {t('settings.logout')}
          </button>
        )}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => onNavigate?.('dashboard')}
          className="h-[46px] px-6 rounded-[7px] border border-border text-sm font-medium text-ink-900 hover:bg-page transition-colors"
        >
          {t('settings.cancel')}
        </button>
        <button
          type="submit"
          className="h-[46px] px-8 rounded-[7px] bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          {t('settings.save')}
        </button>
      </div>

    </form>
  )
}
