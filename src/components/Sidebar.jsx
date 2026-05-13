import {
  LayoutGrid,
  FolderKanban,
  FilePlus2,
  Activity,
  Newspaper,
  HelpCircle,
  Settings,
  X,
} from 'lucide-react'
import { cn } from '../lib/cn'
import NavItem from './NavItem'
import Avatar from './Avatar'
import AGALogo from './AGALogo'
import { useLanguage } from '../contexts/LanguageContext'

const MAIN_MENU = [
  { id: 'dashboard',    labelKey: 'nav.dashboard',  icon: LayoutGrid },
  { id: 'projetos',          labelKey: 'nav.projects',     icon: FolderKanban },
  { id: 'novo-projeto',      labelKey: 'nav.newProject',   icon: FilePlus2 },
  { id: 'monitorados',       labelKey: 'nav.monitoring',   icon: Activity },
  { id: 'relatorio-semanal', labelKey: 'nav.weeklyReport', icon: Newspaper },
]

const BOTTOM_MENU = [
  { id: 'support',  labelKey: 'nav.support',  icon: HelpCircle },
  { id: 'settings', labelKey: 'nav.settings', icon: Settings },
]

const DEFAULT_USER = {
  name: 'Bruno Augusto',
  role: 'Estagiário Nível Superior',
  email: 'baoliveira@aga.gold',
  initials: 'BA',
  avatarSrc: null,
}

export default function Sidebar({ activeId = 'dashboard', onNavigate, user = DEFAULT_USER, isOpen = false, onClose }) {
  const { t } = useLanguage()

  return (
    <aside
      className={cn(
        // Base — always present
        'w-[272px] 4xl:w-[300px] 5xl:w-[320px] shrink-0 bg-sidebar border-r border-border-soft flex flex-col h-screen overflow-hidden',
        // Mobile: fixed drawer, slides in/out
        'fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        // Desktop: static, always visible, no transform
        'lg:static lg:z-auto lg:translate-x-0 lg:transition-none',
      )}
    >
      {/* Logo + mobile close button */}
      <div className="h-[76px] px-6 flex items-center justify-between">
        <AGALogo size="md" />
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full text-ink-400 hover:text-ink-700 hover:bg-page transition-colors"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>

      {/* User profile card */}
      <div className="px-5 mt-8">
        <button
          type="button"
          onClick={() => onNavigate?.('profile')}
          className="w-full h-[65px] px-3 flex items-center gap-3 rounded-xl border border-border-soft bg-surface hover:bg-page transition-colors text-left"
        >
          {user.avatarSrc ? (
            <img
              src={user.avatarSrc}
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover shrink-0"
            />
          ) : (
            <Avatar initials={user.initials} size={40} className="bg-ink-300 text-white shrink-0" />
          )}
          <div className="min-w-0">
            <div className="text-sm font-semibold text-ink-900 truncate leading-5">
              {user.name}
            </div>
            <div className="text-xs text-ink-500 truncate leading-[15px] mt-1">
              {user.role}
            </div>
          </div>
        </button>
      </div>

      {/* Scrollable section: section label + main nav */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Section label */}
        <div className="px-6 mt-8">
          <span className="text-xs font-medium tracking-[0.08em] text-ink-400 uppercase">
            {t('nav.mainMenu')}
          </span>
        </div>

        {/* Main navigation */}
        <nav className="px-6 mt-5 flex flex-col gap-2.5">
          {MAIN_MENU.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={t(item.labelKey)}
              active={activeId === item.id}
              onClick={() => onNavigate?.(item.id)}
            />
          ))}
        </nav>
      </div>

      {/* Bottom navigation — always pinned */}
      <nav className="px-6 pb-8 pt-4 shrink-0 flex flex-col gap-2">
        {BOTTOM_MENU.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={t(item.labelKey)}
            active={activeId === item.id}
            onClick={() => onNavigate?.(item.id)}
          />
        ))}
      </nav>
    </aside>
  )
}
