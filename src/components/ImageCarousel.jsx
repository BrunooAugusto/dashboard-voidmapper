import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../lib/cn'
import { useLanguage } from '../contexts/LanguageContext'

export default function ImageCarousel({ images }) {
  const { t } = useLanguage()
  const [active, setActive] = useState(0)

  function prev() {
    setActive((i) => (i === 0 ? images.length - 1 : i - 1))
  }
  function next() {
    setActive((i) => (i === images.length - 1 ? 0 : i + 1))
  }

  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">
        {t('detail.gallery')}
      </span>

      {/* Main image */}
      <div className="relative rounded-xl overflow-hidden bg-zinc-900 aspect-[16/9]">
        <img
          src={images[active]}
          alt=""
          className="absolute inset-0 w-full h-full object-contain"
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label={t('detail.prevImage')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors backdrop-blur-sm"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label={t('detail.nextImage')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors backdrop-blur-sm"
            >
              <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
            </button>

            <div className="absolute bottom-2.5 right-3 text-[11px] font-medium text-white/80 bg-black/60 px-2 py-0.5 rounded-full tabular-nums">
              {active + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`${t('detail.gallery')} ${i + 1}`}
              className={cn(
                'rounded-lg overflow-hidden bg-zinc-900 h-[130px] w-full border-2 transition-all',
                i === active
                  ? 'border-brand-500 opacity-100'
                  : 'border-transparent opacity-50 hover:opacity-80',
              )}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
