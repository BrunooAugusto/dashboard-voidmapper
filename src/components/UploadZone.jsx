import { useRef, useState, useEffect } from 'react'
import { Upload, X, ImagePlus } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

export default function UploadZone({ onFilesChange }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [items, setItems]       = useState([])
  const { t } = useLanguage()

  useEffect(() => {
    return () => { for (const item of items) URL.revokeObjectURL(item.previewUrl) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function addFiles(newFiles) {
    const valid = newFiles.filter(f => f.type.startsWith('image/'))
    if (!valid.length) return
    const newItems = valid.map(file => ({
      id: `${Date.now()}-${Math.random()}`, file,
      previewUrl: URL.createObjectURL(file), name: file.name,
    }))
    setItems(prev => { const next = [...prev, ...newItems]; onFilesChange?.(next.map(i => i.file)); return next })
  }

  function removeItem(id) {
    setItems(prev => {
      const item = prev.find(i => i.id === id)
      if (item) URL.revokeObjectURL(item.previewUrl)
      const next = prev.filter(i => i.id !== id)
      onFilesChange?.(next.map(i => i.file))
      return next
    })
  }

  function handleDrop(e) { e.preventDefault(); setDragging(false); addFiles(Array.from(e.dataTransfer.files)) }
  function handleFileInput(e) { addFiles(Array.from(e.target.files)); e.target.value = '' }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`min-h-[320px] rounded-[10px] border-2 border-dashed flex flex-col items-center justify-center gap-4 p-6 transition-colors ${
          dragging ? 'border-brand-400 bg-brand-500/10' : 'border-border bg-input-bg'
        }`}
      >
        <div className="w-12 h-12 bg-surface rounded-xl flex items-center justify-center border border-border-soft">
          <Upload className="w-6 h-6 text-ink-400" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-ink-900">{t('form.uploadTitle')}</p>
          <p className="text-xs text-ink-500 mt-1">{t('form.uploadHint')}</p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="h-10 px-5 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors"
        >
          {t('form.uploadButton')}
        </button>
        <input ref={inputRef} type="file" multiple accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileInput} />
      </div>
    )
  }

  // ── Filled state ──────────────────────────────────────────────────────────
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex flex-col gap-3 rounded-[10px] transition-all ${dragging ? 'ring-2 ring-brand-400 ring-offset-2' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink-900">Imagens do Projeto</p>
          <p className="text-xs text-ink-400 mt-0.5">
            {items.length} {items.length !== 1 ? 'imagens' : 'imagem'} adicionada{items.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="shrink-0 h-8 px-3 flex items-center gap-1.5 rounded-lg border border-border-soft bg-surface text-xs font-medium text-ink-700 hover:bg-page hover:border-border transition-colors"
        >
          <ImagePlus className="w-3.5 h-3.5" strokeWidth={2} />
          {t('form.addMore')}
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.id} className="relative rounded-xl overflow-hidden bg-page border border-border-soft aspect-video">
            <img src={item.previewUrl} alt={item.name} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors z-10"
            >
              <X className="w-3 h-3" strokeWidth={2.5} />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2.5 py-1.5 pointer-events-none">
              <p className="text-white text-[10px] truncate">{item.name}</p>
            </div>
          </div>
        ))}
      </div>

      <input ref={inputRef} type="file" multiple accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileInput} />
    </div>
  )
}