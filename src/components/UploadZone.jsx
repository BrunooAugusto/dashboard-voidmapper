import { useRef, useState, useEffect } from 'react'
import { Upload, X, FileImage } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

export default function UploadZone({ files = [], onFilesChange }) {
  const inputRef  = useRef(null)
  const urlCache  = useRef(new Map())
  const [dragging, setDragging] = useState(false)
  const { t } = useLanguage()

  // Keep URL cache in sync with files — create once per file, revoke on removal
  useEffect(() => {
    const currentSet = new Set(files)
    for (const [file, url] of urlCache.current.entries()) {
      if (!currentSet.has(file)) {
        URL.revokeObjectURL(url)
        urlCache.current.delete(file)
      }
    }
    for (const file of files) {
      if (!urlCache.current.has(file)) {
        urlCache.current.set(file, URL.createObjectURL(file))
      }
    }
  }, [files])

  // Revoke all on unmount
  useEffect(() => {
    return () => {
      for (const url of urlCache.current.values()) URL.revokeObjectURL(url)
    }
  }, [])

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/'),
    )
    onFilesChange?.([...files, ...dropped])
  }

  function handleFileInput(e) {
    const picked = Array.from(e.target.files)
    onFilesChange?.([...files, ...picked])
    e.target.value = ''
  }

  function removeFile(index) {
    onFilesChange?.(files.filter((_, i) => i !== index))
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`h-full min-h-[480px] rounded-[10px] border-2 border-dashed flex flex-col items-center justify-center gap-4 p-6 transition-colors ${
        dragging
          ? 'border-brand-400 bg-brand-500/10'
          : 'border-border bg-input-bg'
      }`}
    >
      {files.length === 0 ? (
        <>
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
        </>
      ) : (
        <>
          <div className="w-full flex-1 grid grid-cols-2 gap-3 overflow-y-auto">
            {files.map((file, i) => (
              <div
                key={i}
                className="relative group bg-surface rounded-lg border border-border-soft overflow-hidden aspect-square flex items-center justify-center"
              >
                <img
                  src={urlCache.current.get(file) ?? ''}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                  <p className="text-white text-[10px] truncate">{file.name}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="h-9 px-4 border border-border-soft bg-surface text-ink-700 text-xs font-medium rounded-lg hover:bg-page transition-colors flex items-center gap-1.5"
          >
            <FileImage className="w-3.5 h-3.5" />
            {t('form.addMore')}
          </button>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileInput}
      />
    </div>
  )
}
