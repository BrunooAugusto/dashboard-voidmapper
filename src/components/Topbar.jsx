import { Bell, Moon, Sun } from 'lucide-react'
import SearchInput from './SearchInput'
import IconButton from './IconButton'
import AccountMenu from './AccountMenu'
import { useTheme } from '../contexts/ThemeContext'

export default function Topbar({ user }) {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  function toggleTheme() {
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <header className="h-[76px] bg-surface border-b border-border-soft">
      <div className="h-full max-w-[1520px] mx-auto px-6 flex items-center">
        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <SearchInput />

          <div className="w-2" />

          <IconButton icon={Bell} label="Notifications" />
          <IconButton
            icon={isDark ? Sun : Moon}
            label="Toggle theme"
            onClick={toggleTheme}
          />

          <div className="w-2" />

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
