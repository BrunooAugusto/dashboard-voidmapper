import { Bell, Moon, Sun, Menu } from 'lucide-react'
import SearchInput from './SearchInput'
import IconButton from './IconButton'
import AccountMenu from './AccountMenu'
import { useTheme } from '../contexts/ThemeContext'

export default function Topbar({ user, onMenuToggle }) {
  const { theme, setTheme } = useTheme()
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  function toggleTheme() {
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <header className="h-[76px] bg-surface border-b border-border-soft sticky top-0 z-30">
      <div className="h-full uw-container flex items-center gap-3">

        {/* Hamburger — mobile only */}
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
          className="lg:hidden w-10 h-10 inline-flex items-center justify-center rounded-full text-ink-500 hover:text-ink-900 hover:bg-page transition-colors shrink-0"
        >
          <Menu className="w-5 h-5" strokeWidth={2} />
        </button>

        <div className="flex-1" />

        <div className="flex items-center gap-1.5">
          <div className="hidden sm:block mr-1">
            <SearchInput />
          </div>

          <IconButton icon={Bell} label="Notifications" />
          <IconButton
            icon={isDark ? Sun : Moon}
            label="Toggle theme"
            onClick={toggleTheme}
          />

          <div className="w-px h-5 bg-border-soft mx-2 shrink-0" />

          <AccountMenu
            name={user?.name ?? 'Usuário'}
            email={user?.email ?? ''}
            initials={user?.initials ?? '??'}
            avatarSrc={user?.avatarSrc}
          />
        </div>
      </div>
    </header>
  )
}
