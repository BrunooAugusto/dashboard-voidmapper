import { useState } from 'react'

export default function FolderModal({ title, initialName = '', submitLabel, placeholder, onSubmit, onCancel, loading, error }) {
  const [name, setName] = useState(initialName)

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || loading) return
    onSubmit(trimmed)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onMouseDown={e => { if (e.target === e.currentTarget && !loading) onCancel() }}
    >
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-surface rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
        <p className="text-sm font-medium text-ink-900">{title}</p>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={placeholder}
          autoFocus
          disabled={loading}
          className="h-10 px-3 rounded-lg border border-border-soft bg-surface text-sm text-ink-900 outline-none focus:border-brand-500 transition-colors disabled:opacity-50"
        />
        {error && (
          <p className="text-xs text-danger-fg bg-danger-bg rounded-lg px-3 py-2 break-words">{error}</p>
        )}
        <div className="flex gap-3 mt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 h-10 rounded-full border border-border-soft text-sm font-medium text-ink-700 hover:bg-page transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="flex-1 h-10 rounded-full bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Salvando...' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
