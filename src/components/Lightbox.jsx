import { useState, useEffect, useCallback, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'

const ZOOM_LEVELS = [1, 1.5, 2, 3]

export default function Lightbox({ images, startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex)
  const [zoom, setZoom] = useState(0)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const panStart = useRef({ x: 0, y: 0 })
  const overlayRef = useRef(null)
  const imageContainerRef = useRef(null)

  const scale = ZOOM_LEVELS[zoom]
  const isZoomed = zoom > 0
  const total = images.length

  const resetZoom = useCallback(() => {
    setZoom(0)
    setPan({ x: 0, y: 0 })
  }, [])

  const goPrev = useCallback(() => {
    resetZoom()
    setIndex(i => (i === 0 ? total - 1 : i - 1))
  }, [total, resetZoom])

  const goNext = useCallback(() => {
    resetZoom()
    setIndex(i => (i === total - 1 ? 0 : i + 1))
  }, [total, resetZoom])

  const zoomIn = useCallback(() => {
    setZoom(z => Math.min(z + 1, ZOOM_LEVELS.length - 1))
    setPan({ x: 0, y: 0 })
  }, [])

  const zoomOut = useCallback(() => {
    setZoom(z => {
      const next = Math.max(z - 1, 0)
      if (next === 0) setPan({ x: 0, y: 0 })
      return next
    })
  }, [])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
      else if (e.key === '+' || e.key === '=') zoomIn()
      else if (e.key === '-') zoomOut()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, goPrev, goNext, zoomIn, zoomOut])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const el = imageContainerRef.current
    if (!el) return
    function onWheel(e) {
      e.preventDefault()
      if (e.deltaY < 0) zoomIn()
      else zoomOut()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoomIn, zoomOut])

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose()
  }

  function handlePointerDown(e) {
    if (!isZoomed) return
    dragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY }
    panStart.current = { ...pan }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e) {
    if (!dragging.current) return
    setPan({
      x: panStart.current.x + (e.clientX - dragStart.current.x),
      y: panStart.current.y + (e.clientY - dragStart.current.y),
    })
  }

  function handlePointerUp() {
    dragging.current = false
  }

  function handleDoubleClick() {
    if (isZoomed) resetZoom()
    else zoomIn()
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 select-none"
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3">
        <span className="text-sm font-medium text-white/80 tabular-nums">
          {index + 1} / {total}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={zoomOut}
            disabled={zoom === 0}
            className="w-9 h-9 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ZoomOut className="w-5 h-5" strokeWidth={1.75} />
          </button>
          <span className="text-xs text-white/60 tabular-nums w-10 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            disabled={zoom === ZOOM_LEVELS.length - 1}
            className="w-9 h-9 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ZoomIn className="w-5 h-5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors ml-2"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Navigation arrows */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors backdrop-blur-sm"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors backdrop-blur-sm"
          >
            <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </>
      )}

      {/* Image */}
      <div
        ref={imageContainerRef}
        className="max-w-[90vw] max-h-[85vh] overflow-hidden"
        onDoubleClick={handleDoubleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ cursor: isZoomed ? 'grab' : 'zoom-in' }}
      >
        <img
          src={images[index]}
          alt=""
          draggable={false}
          className="max-w-[90vw] max-h-[85vh] object-contain transition-transform duration-150"
          style={{
            transform: `scale(${scale}) translate(${pan.x / scale}px, ${pan.y / scale}px)`,
          }}
        />
      </div>
    </div>
  )
}
