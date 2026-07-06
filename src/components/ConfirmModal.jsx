export default function ConfirmModal({ message, onConfirm, onCancel, loading, error, confirmLabel = 'Excluir projeto', loadingLabel = 'Excluindo...' }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onMouseDown={e => { if (e.target === e.currentTarget && !loading) onCancel() }}
    >
      <div className="w-full max-w-sm bg-surface rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
        <p className="text-sm text-ink-700 leading-relaxed">{message}</p>
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
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 h-10 rounded-full bg-danger-bg text-danger-fg text-sm font-semibold hover:brightness-95 transition-all disabled:opacity-50"
          >
            {loading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
