import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppShell({ children, activeId, onNavigate, user }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function handleNavigate(id) {
    onNavigate(id)
    setSidebarOpen(false)
  }

  return (
    <div className="h-screen overflow-hidden flex bg-page">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        activeId={activeId}
        onNavigate={handleNavigate}
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
        <Topbar
          user={user}
          onMenuToggle={() => setSidebarOpen((v) => !v)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="uw-container py-4 sm:py-6 3xl:py-8 4xl:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
