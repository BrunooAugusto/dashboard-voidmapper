import { useState } from 'react'
import AppShell from './components/AppShell'
import KpiSection from './components/KpiSection'
import MidSection from './components/MidSection'
import RecentSurveysTable from './components/RecentSurveysTable'
import ProjectsPage from './components/ProjectsPage'
import ProjectDetailsPage from './components/ProjectDetailsPage'
import CreateProjectPage from './components/CreateProjectPage'
import EditProjectPage from './components/EditProjectPage'
import ReportsPage from './components/ReportsPage'
import MonitoringPage from './components/MonitoringPage'
import ProfileEditPage from './components/ProfileEditPage'
import SettingsPage from './components/SettingsPage'
import LoginPage from './components/auth/LoginPage'
import RegisterPage from './components/auth/RegisterPage'
import ForgotPasswordPage from './components/auth/ForgotPasswordPage'
import ProfileSetupPage from './components/auth/ProfileSetupPage'

function DashboardPage() {
  return (
    <div className="space-y-5">
      <KpiSection />
      <MidSection />
      <RecentSurveysTable />
    </div>
  )
}

export default function App() {
  const [authScreen, setAuthScreen]             = useState('login') // 'login' | 'register' | 'forgot-password'
  const [isAuthenticated, setIsAuthenticated]   = useState(false)
  const [isProfileComplete, setIsProfileComplete] = useState(false)
  const [loginEmail, setLoginEmail]             = useState('')
  const [userProfile, setUserProfile]           = useState({
    name: '', role: '', email: '', initials: '', avatarSrc: null,
  })

  const [activeNav, setActiveNav]           = useState('dashboard')
  const [selectedProject, setSelectedProject] = useState(null)

  // ── Auth handlers ──────────────────────────────────────────────────────────

  function handleLogin({ email }) {
    // Existing user: derive a minimal profile from the email and skip profile setup.
    const prefix   = email.split('@')[0]
    const name     = prefix.charAt(0).toUpperCase() + prefix.slice(1)
    const initials = prefix.slice(0, 2).toUpperCase()
    setUserProfile({ name, role: 'Usuário', email, initials, avatarSrc: null })
    setIsAuthenticated(true)
    setIsProfileComplete(true)
  }

  function handleRegister({ email }) {
    // New user: authenticate but leave isProfileComplete = false so ProfileSetupPage renders.
    setLoginEmail(email)
    setIsAuthenticated(true)
  }

  function handleProfileComplete(profile) {
    setUserProfile(profile)
    setIsProfileComplete(true)
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
        initialEmail={loginEmail}
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
          onBack={() => setActiveNav('project-details')}
        />
      )
    }
    if (activeNav === 'project-details' && selectedProject) {
      return (
        <ProjectDetailsPage
          project={selectedProject}
          onBack={() => handleNavigate('projetos')}
          onEdit={handleEditProject}
        />
      )
    }
    if (activeNav === 'projetos') {
      return (
        <ProjectsPage
          onSelectProject={handleSelectProject}
          onNavigate={handleNavigate}
        />
      )
    }
    if (activeNav === 'novo-projeto') {
      return (
        <CreateProjectPage onBack={() => handleNavigate('projetos')} />
      )
    }
    if (activeNav === 'relatorio') {
      return (
        <ReportsPage onBack={() => handleNavigate('dashboard')} />
      )
    }
    if (activeNav === 'monitorados') {
      return (
        <MonitoringPage onBack={() => handleNavigate('dashboard')} />
      )
    }
    if (activeNav === 'settings') {
      return (
        <SettingsPage
          user={userProfile}
          onSave={setUserProfile}
          onNavigate={handleNavigate}
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
    return <DashboardPage />
  }

  return (
    <AppShell activeId={activeNav} onNavigate={handleNavigate} user={userProfile}>
      {renderContent()}
    </AppShell>
  )
}
