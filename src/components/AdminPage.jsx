import { useState, useEffect } from 'react'
import { ShieldOff } from 'lucide-react'
import Card from './Card'
import { cn } from '../lib/cn'
import { getUsers, updateUserRole, APP_ROLES, ROLE_LABELS } from '../services/adminService'
import { logAction } from '../services/auditService'
import { usePermissions } from '../hooks/usePermissions'

const ROLE_BADGE = {
  admin:        'bg-[#EEF2FF] text-[#4F46E5] border-[#6366F1]/20',
  gestor:       'bg-brand-500/10 text-brand-500 border-brand-500/20',
  editor:       'bg-success-bg text-success-fg border-success-fg/20',
  visualizador: 'bg-page text-ink-500 border-border-soft',
}

export default function AdminPage({ user }) {
  const perms = usePermissions(user)

  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(null)
  const [roles,   setRoles]   = useState({})
  const [toast,   setToast]   = useState(null)
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    if (!perms.canManageUsers) return
    getUsers()
      .then(data => {
        setUsers(data)
        const init = {}
        for (const u of data) init[u.id] = u.appRole
        setRoles(init)
      })
      .catch(err => {
        console.error('[admin] getUsers failed:', err)
        setFetchError(err.message)
      })
      .finally(() => setLoading(false))
  }, [perms.canManageUsers])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSaveRole(u) {
    const newRole = roles[u.id]
    if (!newRole || newRole === u.appRole) return
    setSaving(u.id)
    try {
      await updateUserRole(u.id, newRole)
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, appRole: newRole } : x))
      const label = ROLE_LABELS[newRole] ?? newRole
      await logAction({
        action: 'update_user_role', entityType: 'user',
        entityId: u.id, entityName: u.name || u.email,
        description: `Alterou cargo de ${u.email} para ${label}`,
        oldValue: { app_role: u.appRole }, newValue: { app_role: newRole },
      })
      showToast(`Cargo de ${u.name || u.email} atualizado para ${label}`)
    } catch (err) {
      console.error(err)
      showToast('Erro ao atualizar cargo', 'error')
    } finally {
      setSaving(null)
    }
  }

  // ── Permission guard ──────────────────────────────────────────────────────
  if (!perms.canManageUsers) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <ShieldOff className="w-12 h-12 text-ink-300" strokeWidth={1.5} />
        <p className="text-base font-semibold text-ink-500">
          Você não tem permissão para acessar esta área.
        </p>
      </div>
    )
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const counts = {
    total:        users.length,
    admin:        users.filter(u => u.appRole === 'admin').length,
    gestor:       users.filter(u => u.appRole === 'gestor').length,
    editor:       users.filter(u => u.appRole === 'editor').length,
    visualizador: users.filter(u => u.appRole === 'visualizador').length,
  }

  const STATS = [
    { label: 'Total',           value: counts.total,        color: 'text-ink-900'    },
    { label: 'Administradores', value: counts.admin,        color: 'text-[#4F46E5]'  },
    { label: 'Gestores',        value: counts.gestor,       color: 'text-brand-500'  },
    { label: 'Editores',        value: counts.editor,       color: 'text-success-fg' },
    { label: 'Visualizadores',  value: counts.visualizador, color: 'text-ink-400'    },
  ]

  return (
    <>
      <div className="mb-5">
        <h2 className="text-[28px] font-semibold text-ink-900 leading-tight">Administração</h2>
        <p className="text-sm text-ink-500 mt-1">
          Gerencie usuários, cargos e permissões de acesso ao sistema.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        {STATS.map(s => (
          <Card key={s.label}>
            <div className="px-4 py-3">
              <p className="text-xs text-ink-500 font-medium">{s.label}</p>
              <p className={cn('text-3xl font-black mt-1 tabular-nums', s.color)}>{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Users table */}
      <Card>
        <div className="px-5 py-4 border-b border-border-soft">
          <h3 className="text-sm font-semibold text-ink-900">Usuários do Sistema</h3>
        </div>

        {loading ? (
          <p className="p-12 text-center text-sm text-ink-400">Carregando...</p>
        ) : fetchError ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-danger-fg mb-1">Erro ao carregar usuários</p>
            <p className="text-xs text-ink-400">{fetchError}</p>
            <p className="text-xs text-ink-400 mt-2">Execute o ADMIN_SETUP.sql no Supabase e recarregue.</p>
          </div>
        ) : users.length === 0 ? (
          <p className="p-12 text-center text-sm text-ink-400">Nenhum usuário encontrado. Execute ADMIN_SETUP.sql no Supabase.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-border-soft">
                  {['Nome', 'Email', 'Cargo', 'Nível de Acesso', 'Ações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {users.map(u => {
                  const currentRole = roles[u.id] ?? u.appRole
                  const isDirty     = currentRole !== u.appRole
                  const isSelf      = u.id === user?.id
                  return (
                    <tr key={u.id} className="hover:bg-page transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-ink-900">{u.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-ink-500 truncate max-w-[200px]">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-ink-500">{u.jobRole}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border',
                          ROLE_BADGE[u.appRole] ?? ROLE_BADGE.visualizador,
                        )}>
                          {ROLE_LABELS[u.appRole] ?? u.appRole}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isSelf ? (
                          <span className="text-xs text-ink-400 italic">Você</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <select
                              value={currentRole}
                              onChange={e => setRoles(prev => ({ ...prev, [u.id]: e.target.value }))}
                              className="h-8 pl-2 pr-6 rounded-lg border border-border-soft bg-surface text-xs font-medium text-ink-900 outline-none focus:border-brand-400 transition-colors"
                            >
                              {APP_ROLES.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                              ))}
                            </select>
                            {isDirty && (
                              <button
                                type="button"
                                onClick={() => handleSaveRole(u)}
                                disabled={saving === u.id}
                                className="h-8 px-3 rounded-lg bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50"
                              >
                                {saving === u.id ? '...' : 'Salvar'}
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Toast */}
      {toast && (
        <div className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-xl pointer-events-none whitespace-nowrap',
          toast.type === 'error' ? 'bg-danger-fg' : 'bg-ink-900',
        )}>
          {toast.msg}
        </div>
      )}
    </>
  )
}