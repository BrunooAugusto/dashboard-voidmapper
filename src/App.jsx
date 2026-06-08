import { useState, useEffect } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import * as authService from './services/authService'
import { setUnauthorizedHandler } from './services/api'
import { supabase } from './lib/supabase.js'
import AppShell from './components/AppShell'
import KpiSection from './components/KpiSection'
import MidSection from './components/MidSection'
import RecentSurveysTable from './components/RecentSurveysTable'
import ProjectsPage from './components/ProjectsPage'
import ProjectDetailsPage from './components/ProjectDetailsPage'
import CreateProjectPage from './components/CreateProjectPage'
import EditProjectPage from './components/EditProjectPage'
import WeeklyReportPage from './components/WeeklyReportPage'
import MonitoringPage from './components/MonitoringPage'
import MonitoringEditPage from './components/MonitoringEditPage'
import ProfileEditPage from './components/ProfileEditPage'
import SettingsPage from './components/SettingsPage'
import AdminPage   from './components/AdminPage'
import LoginPage from './components/auth/LoginPage'
import RegisterPage from './components/auth/RegisterPage'
import ForgotPasswordPage from './components/auth/ForgotPasswordPage'
import ProfileSetupPage from './components/auth/ProfileSetupPage'

const EMPTY_PROFILE = { name: '', role: '', email: '', initials: '', avatarSrc: null }

function DashboardPage({ onNavigate, onSelectProject }) {
  return (
    <div className="space-y-5 3xl:space-y-6 4xl:space-y-8">
      <KpiSection onNavigate={onNavigate} />
      <MidSection onSelectProject={onSelectProject} />
      <RecentSurveysTable />
    </div>
  )
}

// Strip blob: avatar URLs before persisting (they are session-scoped and don't survive refresh).
function sanitizeProfile(profile) {
  return {
    ...profile,
    avatarSrc: profile.avatarSrc?.startsWith?.('blob:') ? null : (profile.avatarSrc ?? null),
  }
}

export default function App() {
  const [authScreen, setAuthScreen]               = useState('login')
  const [isAuthenticated, setIsAuthenticated]     = useLocalStorage('voidmapper_auth', false)
  const [isProfileComplete, setIsProfileComplete] = useLocalStorage('voidmapper_onboarding_complete', false)
  const [userProfile, setUserProfileRaw]          = useLocalStorage('voidmapper_profile', EMPTY_PROFILE)

  // Sync Supabase session state with app auth state
  useEffect(() => {
    setUnauthorizedHandler(() => {
      authService.logout()
      setIsAuthenticated(false)
      setIsProfileComplete(false)
      setUserProfileRaw(EMPTY_PROFILE)
      setAuthScreen('login')
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false)
        setIsProfileComplete(false)
        setUserProfileRaw(EMPTY_PROFILE)
        setAuthScreen('login')
      }
    })

    if (isAuthenticated) {
      authService.getMe()
        .then((user) => {
          setUserProfile({ name: user.name, role: user.role, email: user.email, initials: user.initials, avatarSrc: null })
        })
        .catch(() => {
          setIsAuthenticated(false)
          setIsProfileComplete(false)
          setUserProfileRaw(EMPTY_PROFILE)
        })
    }

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [activeNav, setActiveNav]                   = useState('dashboard')
  const [selectedProject, setSelectedProject]       = useState(null)
  const [editingMonitoringRow, setEditingMonitoringRow] = useState(null)
  const [projectsKey, setProjectsKey]               = useState(0)
  const [monitoringKey, setMonitoringKey]           = useState(0)

  function setUserProfile(profile) {
    setUserProfileRaw(sanitizeProfile(profile))
  }

  // ── Auth handlers ──────────────────────────────────────────────────────────

  async function handleLogin({ email, password }) {
    const user = await authService.login({ email, password })
    setUserProfile({ name: user.name, role: user.role, email: user.email, initials: user.initials, avatarSrc: null })
    setIsAuthenticated(true)
    setIsProfileComplete(user.profileComplete ?? false)
  }

  async function handleRegister({ email, name, password }) {
    const user = await authService.register({ email, name, password })
    setUserProfile({ name: user.name, role: user.role, email: user.email, initials: user.initials, avatarSrc: null })
    setIsAuthenticated(true)
    setIsProfileComplete(false)
  }

  async function handleProfileComplete(profile) {
    try {
      await authService.updateProfile({ ...profile, profileComplete: true })
    } catch { }
    setUserProfile(profile)
    setIsProfileComplete(true)
  }

  function handleLogout() {
    authService.logout()
    setIsAuthenticated(false)
    setIsProfileComplete(false)
    setUserProfileRaw(EMPTY_PROFILE)
    setAuthScreen('login')
  }

  // ── Auth gates ─────────────────────────────────────────────────────────────

  if (!isAuthenticated) {
    if (authScreen === 'register') {
      return (
        <RegisterPage
          onRegister={handleRegister}
          onGoToLogin={() => setAuthScreen('login')}
        />
      )
    }
    if (authScreen === 'forgot-password') {
      return (
        <ForgotPasswordPage
          onGoToLogin={() => setAuthScreen('login')}
        />
      )
    }
    return (
      <LoginPage
        onLogin={handleLogin}
        onGoToRegister={() => setAuthScreen('register')}
        onGoToForgotPassword={() => setAuthScreen('forgot-password')}
      />
    )
  }

  if (!isProfileComplete) {
    return (
      <ProfileSetupPage
        initialEmail={userProfile.email}
        onComplete={handleProfileComplete}
      />
    )
  }

  // ── Dashboard navigation ───────────────────────────────────────────────────

  function handleNavigate(id) {
    setActiveNav(id)
    if (id !== 'project-details' && id !== 'edit-project') {
      setSelectedProject(null)
    }
    if (id !== 'monitorados') {
      setEditingMonitoringRow(null)
    }
  }

  function handleSelectProject(project) {
    setSelectedProject(project)
    setActiveNav('project-details')
  }

  function handleEditProject(project) {
    setSelectedProject(project ?? selectedProject)
    setActiveNav('edit-project')
  }

  function renderContent() {
    if (activeNav === 'edit-project') {
      return (
        <EditProjectPage
          project={selectedProject}
          onBack={() => { setProjectsKey(k => k + 1); setActiveNav('project-details') }}
        />
      )
    }
    if (activeNav === 'project-details' && selectedProject) {
      return (
        <ProjectDetailsPage
          project={selectedProject}
          onBack={() => handleNavigate('projetos')}
          onEdit={handleEditProject}
          onDelete={() => { setProjectsKey(k => k + 1); handleNavigate('projetos') }}
        />
      )
    }
    if (activeNav === 'projetos') {
      return (
        <ProjectsPage
          key={projectsKey}
          onSelectProject={handleSelectProject}
          onNavigate={handleNavigate}
          user={userProfile}
        />
      )
    }
    if (activeNav === 'novo-projeto') {
      return (
        <CreateProjectPage onBack={() => { setProjectsKey(k => k + 1); handleNavigate('projetos') }} />
      )
    }
    if (activeNav === 'relatorio-semanal') {
      return (
        <WeeklyReportPage onBack={() => handleNavigate('dashboard')} user={userProfile} />
      )
    }
    if (activeNav === 'monitorados') {
      if (editingMonitoringRow) {
        return (
          <MonitoringEditPage
            row={editingMonitoringRow}
            onBack={() => { setMonitoringKey(k => k + 1); setEditingMonitoringRow(null) }}
          />
        )
      }
      return (
        <MonitoringPage
          key={monitoringKey}
          onBack={() => handleNavigate('dashboard')}
          onSelectRow={(row) => setEditingMonitoringRow(row)}
          onNew={() => setEditingMonitoringRow({})}
          user={userProfile}
        />
      )
    }
    if (activeNav === 'admin') {
      if (userProfile.email?.toLowerCase() !== 'baoliveira@aga.gold') {
        return (
          <div className="flex items-center justify-center h-full min-h-[60vh]">
            <p className="text-ink-500 text-base">Você não tem permissão para acessar esta área.</p>
          </div>
        )
      }
      return <AdminPage user={userProfile} />
    }
    if (activeNav === 'settings') {
      return (
        <SettingsPage
          user={userProfile}
          onSave={setUserProfile}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )
    }
    if (activeNav === 'profile') {
      return (
        <ProfileEditPage
          user={userProfile}
          onSave={setUserProfile}
          onBack={() => handleNavigate('dashboard')}
        />
      )
    }
    return <DashboardPage onNavigate={handleNavigate} onSelectProject={handleSelectProject} />
  }

  return (
    <AppShell activeId={activeNav} onNavigate={handleNavigate} user={userProfile}>
      {renderContent()}
    </AppShell>
  )
}
