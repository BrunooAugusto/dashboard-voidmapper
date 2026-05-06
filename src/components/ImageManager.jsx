import { useRef } from 'react'
import { Camera, X, ImagePlus } from 'lucide-react'
import { cn } from '../lib/cn'

function ImageCard({ image, index, onReplace, onRemove }) {
  const inputRef = useRef(null)

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (file) onReplace(index, file)
    e.target.value = ''
  }

  return (
    <div className="relative group rounded-xl overflow-hidden bg-zinc-900 aspect-[5/3]">
      <img
        src={image.src}
        alt={`Imagem ${index + 1}`}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />

      {/* Dark overlay on hover */}
      <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
        <button
          type="button"
          title="Substituir imagem"
          onClick={() => inputRef.current?.click()}
          className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white hover:bg-brand-600 transition-colors shadow-lg"
        >
          <Camera className="w-4 h-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          title="Remover imagem"
          onClick={() => onRemove(index)}
          className="w-10 h-10 rounded-full bg-white/15 border border-white/30 flex items-center justify-center text-white hover:bg-red-500 hover:border-red-500 transition-colors shadow-lg"
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>

      {/* Index chip */}
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
      className="aspect-[5/3] rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-ink-400 hover:border-brand-400 hover:text-brand-500 hover:bg-brand-50 transition-all duration-200"
    >
      <ImagePlus className="w-6 h-6" strokeWidth={1.75} />
      <span className="text-xs font-medium">Adicionar</span>
    </button>
  )
}

export default function ImageManager({ images = [], onChange }) {
  const addInputRef = useRef(null)

  function handleAdd(e) {
    const newFiles = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith('image/'),
    )
    const newImages = newFiles.map((file, i) => ({
      id: Date.now() + i,
      src: URL.createObjectURL(file),
      file,
    }))
    onChange([...images, ...newImages])
    e.target.value = ''
  }

  function handleReplace(index, file) {
    const updated = images.map((img, i) =>
      i === index ? { ...img, src: URL.createObjectURL(file), file } : img,
    )
    onChange(updated)
  }

  function handleRemove(index) {
    onChange(images.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink-900">
          Imagens do Projeto
          <span className="ml-2 text-xs font-normal text-ink-400">
            ({images.length})
          </span>
        </span>
        <button
          type="button"
          onClick={() => addInputRef.current?.click()}
          className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-border-soft bg-surface text-xs font-medium text-ink-700 hover:bg-page hover:border-border transition-colors"
        >
          <ImagePlus className="w-3.5 h-3.5" strokeWidth={2} />
          Adicionar Imagem
        </button>
      </div>

      {/* Image grid */}
      <div
        className={cn(
          'grid gap-3',
          images.length === 0 ? 'grid-cols-1' : 'grid-cols-2',
        )}
      >
        {images.map((img, i) => (
          <ImageCard
            key={img.id}
            image={img}
            index={i}
            onReplace={handleReplace}
            onRemove={handleRemove}
          />
        ))}

        {/* Add tile — always shown at the end */}
        <AddTile onClick={() => addInputRef.current?.click()} />
      </div>

      {images.length === 0 && (
        <p className="text-xs text-ink-400 text-center -mt-1">
          Nenhuma imagem adicionada. Clique em &quot;Adicionar Imagem&quot; para começar.
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
