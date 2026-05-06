import {
  LayoutGrid,
  FolderKanban,
  FilePlus2,
  FileBarChart2,
  Activity,
  HelpCircle,
  Settings,
} from 'lucide-react'
import NavItem from './NavItem'
import Avatar from './Avatar'
import { useLanguage } from '../contexts/LanguageContext'

const MAIN_MENU = [
  { id: 'dashboard',    labelKey: 'nav.dashboard',  icon: LayoutGrid },
  { id: 'projetos',     labelKey: 'nav.projects',   icon: FolderKanban },
  { id: 'novo-projeto', labelKey: 'nav.newProject', icon: FilePlus2 },
  { id: 'relatorio',    labelKey: 'nav.reports',    icon: FileBarChart2 },
  { id: 'monitorados',  labelKey: 'nav.monitoring', icon: Activity },
]

const BOTTOM_MENU = [
  { id: 'support',  labelKey: 'nav.support',   icon: HelpCircle },
  { id: 'settings', labelKey: 'nav.settings',  icon: Settings },
]

const DEFAULT_USER = {
  name: 'Bruno Augusto',
  role: 'Estagiário Nível Superior',
  email: 'baoliveira@aga.gold',
  initials: 'BA',
  avatarSrc: null,
}

export default function Sidebar({ activeId = 'dashboard', onNavigate, user = DEFAULT_USER }) {
  const { t } = useLanguage()

  return (
    <aside className="w-[272px] shrink-0 bg-sidebar border-r border-border-soft flex flex-col">
      {/* Logo */}
      <div className="h-[76px] px-6 flex items-center">
        <h1 className="text-[20px] font-bold tracking-tight text-ink-900 leading-6">
          Void <span className="text-ink-900">Mapper</span>
        </h1>
      </div>

      {/* User profile card */}
      <div className="px-[18px] mt-[34px]">
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

      {/* Section label */}
      <div className="px-6 mt-[35px]">
        <span className="text-xs font-medium tracking-[0.08em] text-ink-400 uppercase">
          {t('nav.mainMenu')}
        </span>
      </div>

      {/* Main navigation */}
      <nav className="px-6 mt-[18px] flex flex-col gap-[10px]">
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

      {/* Bottom navigation */}
      <nav className="px-6 mt-auto mb-8 flex flex-col gap-2">
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
