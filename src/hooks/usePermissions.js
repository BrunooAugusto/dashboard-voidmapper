// Permission map by app_role
// appRole undefined = pre-migration → full access (backward compat)
const PERM = {
  admin: {
    canManageUsers:      true,
    canCreateProject:    true,
    canEditProject:      true,
    canDeleteProject:    true,
    canCreateMonitoring: true,
    canDeleteMonitoring: true,
    canGenerateReport:   true,
    canViewHistory:      true,
    canViewOnly:         false,
  },
  gestor: {
    canManageUsers:      false,
    canCreateProject:    true,
    canEditProject:      true,
    canDeleteProject:    true,
    canCreateMonitoring: true,
    canDeleteMonitoring: true,
    canGenerateReport:   true,
    canViewHistory:      true,
    canViewOnly:         false,
  },
  editor: {
    canManageUsers:      false,
    canCreateProject:    true,
    canEditProject:      true,
    canDeleteProject:    false,
    canCreateMonitoring: true,
    canDeleteMonitoring: false,
    canGenerateReport:   true,
    canViewHistory:      false,
    canViewOnly:         false,
  },
  visualizador: {
    canManageUsers:      false,
    canCreateProject:    false,
    canEditProject:      false,
    canDeleteProject:    false,
    canCreateMonitoring: false,
    canDeleteMonitoring: false,
    canGenerateReport:   false,
    canViewHistory:      false,
    canViewOnly:         true,
  },
}

const FULL_ACCESS = PERM.admin

/** Normalizes role string to internal key */
function normalizeRole(raw) {
  if (!raw) return null
  const lower = String(raw).toLowerCase().trim()
  if (lower === 'admin' || lower === 'administrador') return 'admin'
  if (lower === 'gestor')   return 'gestor'
  if (lower === 'editor')   return 'editor'
  if (lower === 'visualizador')                       return 'visualizador'
  return null  // unknown → treat as visualizador
}

const ADMIN_PAGE_EMAIL = 'baoliveira@aga.gold'

/**
 * Returns permission flags for the given user.
 * Accepts appRole variations: admin/administrador, gestor/supervisor, etc.
 * appRole undefined = pre-migration → full access (backward compat).
 */
export function usePermissions(user) {
  const rawRole = user?.appRole
  const appRole = rawRole ? normalizeRole(rawRole) : null
  const perms   = appRole ? (PERM[appRole] ?? PERM.visualizador) : FULL_ACCESS
  const resolvedRole = appRole ?? (rawRole ? 'visualizador' : 'admin')
  const isAdminPage = user?.email?.toLowerCase() === ADMIN_PAGE_EMAIL
  return {
    ...perms,
    appRole: resolvedRole,
    isAdmin: resolvedRole === 'admin',
    isAdminPage,
  }
}
