import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppShell({ children, activeId, onNavigate, user }) {
  return (
    <div className="min-h-screen flex bg-page">
      <Sidebar activeId={activeId} onNavigate={onNavigate} user={user} />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={user} />
        <main className="flex-1">
          <div className="max-w-[1520px] mx-auto px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
