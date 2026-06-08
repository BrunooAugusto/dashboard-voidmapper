import { useRef, useEffect } from 'react'
import { Camera, X, ImagePlus } from 'lucide-react'
import { cn } from '../lib/cn'
import { useLanguage } from '../contexts/LanguageContext'

function ImageCard({ image, index, onReplace, onRemove }) {
  const inputRef = useRef(null)

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (file) onReplace(index, file)
    e.target.value = ''
  }

  return (
    <div className="relative rounded-xl overflow-hidden bg-page border border-border-soft aspect-video group">
      <img
        src={image.src}
        alt={`Imagem ${index + 1}`}
        className="w-full h-full object-cover"
      />

      {/* Replace overlay on hover */}
      <button
        type="button"
        title="Substituir imagem"
        onClick={() => inputRef.current?.click()}
        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 transition-opacity"
      >
        <span className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center border border-white/30 backdrop-blur-sm">
          <Camera className="w-4 h-4 text-white" strokeWidth={2} />
        </span>
      </button>

      {/* Remove button — always visible */}
      <button
        type="button"
        title="Remover imagem"
        onClick={() => onRemove(index)}
        className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors z-10"
      >
        <X className="w-3 h-3" strokeWidth={2.5} />
      </button>

      {/* Index badge */}
      <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm pointer-events-none">
        {index + 1}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}

function AddTile({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="aspect-video rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-ink-400 hover:border-brand-400 hover:text-brand-500 hover:bg-brand-500/10 transition-all duration-200"
    >
      <ImagePlus className="w-5 h-5" strokeWidth={1.75} />
      <span className="text-xs font-medium">Adicionar</span>
    </button>
  )
}

export default function ImageManager({ images = [], onChange }) {
  const addInputRef = useRef(null)
  const { t } = useLanguage()

  useEffect(() => {
    return () => {
      for (const img of images) {
        if (img.src?.startsWith('blob:')) URL.revokeObjectURL(img.src)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleAdd(e) {
    const newFiles = Array.from(e.target.files ?? []).filter(f => f.type.startsWith('image/'))
    const newImages = newFiles.map((file, i) => ({
      id: Date.now() + i,
      src: URL.createObjectURL(file),
      file,
    }))
    onChange([...images, ...newImages])
    e.target.value = ''
  }

  function handleReplace(index, file) {
    const old = images[index]
    if (old?.src?.startsWith('blob:')) URL.revokeObjectURL(old.src)
    onChange(images.map((img, i) => i === index ? { ...img, src: URL.createObjectURL(file), file } : img))
  }

  function handleRemove(index) {
    const img = images[index]
    if (img?.src?.startsWith('blob:')) URL.revokeObjectURL(img.src)
    onChange(images.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink-900">
            {t('form.imagesLabel')}
          </p>
          <p className="text-xs text-ink-400 mt-0.5">
            {images.length > 0
              ? `${images.length} ${images.length !== 1 ? 'imagens' : 'imagem'} adicionada${images.length !== 1 ? 's' : ''}`
              : 'Nenhuma imagem adicionada'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => addInputRef.current?.click()}
          className={cn(
            'shrink-0 h-8 px-3 flex items-center gap-1.5 rounded-lg border text-xs font-medium transition-colors',
            'border-border-soft bg-surface text-ink-700 hover:bg-page hover:border-border',
          )}
        >
          <ImagePlus className="w-3.5 h-3.5" strokeWidth={2} />
          {t('form.addImage')}
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {images.map((img, i) => (
          <ImageCard
            key={img.id}
            image={img}
            index={i}
            onReplace={handleReplace}
            onRemove={handleRemove}
          />
        ))}
        <AddTile onClick={() => addInputRef.current?.click()} />
      </div>

      {images.length === 0 && (
        <p className="text-xs text-ink-400 text-center -mt-1">
          {t('form.noImagesHint')}
        </p>
      )}

      <input
        ref={addInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={handleAdd}
      />
    </div>
  )
}