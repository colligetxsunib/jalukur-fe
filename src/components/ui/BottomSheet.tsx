/**
 * BottomSheet — pola inti thumb-first JalurKu (design.md §4.3, §5.3).
 *
 * Muncul dari bawah, radius atas lg, grabber bar, overlay. Tutup via:
 *  - swipe-down (drag melewati ambang / kecepatan tinggi)
 *  - tap overlay
 *  - tombol close / Escape
 *
 * Fitur: scroll-lock saat terbuka, hormati prefers-reduced-motion, safe-area bottom,
 * header sticky opsional, konten scrollable (max-height 90dvh), haptic saat dismiss.
 *
 * Catatan: implementasi mandiri (tanpa dependency animasi) agar aman di sandbox tanpa npm.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { haptic, HAPTIC } from '../../lib/haptics'
import { DURATION, EASE_EXPRESSIVE, prefersReducedMotion } from '../../lib/motion'

export interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: React.ReactNode
  subtitle?: React.ReactNode
  /** Node sticky di atas (menimpa title/subtitle default bila diberikan). */
  header?: React.ReactNode
  /** Node sticky di bawah (mis. CTA utama). Dapat safe-area padding otomatis. */
  footer?: React.ReactNode
  children: React.ReactNode
  /** Jarak drag (px) sebelum dianggap dismiss. Default 110. */
  dismissThreshold?: number
  className?: string
  /** Lebar maksimum konten (desktop); sheet tetap center bila desktopPlacement='center'. Default 480px. */
  maxWidth?: number
  /** Penempatan di desktop: 'center' (tengah) atau 'right' (pojok kanan bawah native). Default 'center'. */
  desktopPlacement?: 'center' | 'right'
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  open,
  onClose,
  title,
  subtitle,
  header,
  footer,
  children,
  dismissThreshold = 110,
  className = '',
  maxWidth = 480,
  desktopPlacement = 'center',
}) => {
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false) // mengontrol transisi masuk/keluar
  const [dragY, setDragY] = useState(0)
  const dragStart = useRef<{ y: number; t: number } | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const reduce = prefersReducedMotion()

  // Mount/unmount dengan transisi keluar
  useEffect(() => {
    if (open) {
      setMounted(true)
      // next frame -> aktifkan transisi masuk
      const id = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(id)
    }
    setVisible(false)
    const t = setTimeout(() => setMounted(false), reduce ? 0 : DURATION.base)
    return () => clearTimeout(t)
  }, [open, reduce])

  // Scroll lock pada body saat sheet terbuka
  useEffect(() => {
    if (!mounted) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mounted])

  // Escape untuk menutup
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const requestClose = useCallback(() => {
    haptic(HAPTIC.select)
    onClose()
  }, [onClose])

  // --- Drag-to-dismiss (pointer events) ---
  const onPointerDown = (e: React.PointerEvent) => {
    // Pada desktop dengan placement 'right', nonaktifkan drag agar interaksi mouse tetap native
    if (desktopPlacement === 'right' && typeof window !== 'undefined' && window.innerWidth >= 768) {
      return
    }
    const target = e.target as HTMLElement
    // Abaikan jika interaksi pada button
    if (target.closest('button')) return
    // hanya mulai drag dari grabber/header area (ditandai data-sheet-handle)
    if (!target.closest('[data-sheet-handle]')) return
    dragStart.current = { y: e.clientY, t: Date.now() }
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current) return
    const dy = e.clientY - dragStart.current.y
    setDragY(Math.max(0, dy)) // hanya tarik ke bawah
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragStart.current) return
    const dy = e.clientY - dragStart.current.y
    const dt = Date.now() - dragStart.current.t
    const velocity = dy / Math.max(dt, 1) // px/ms
    dragStart.current = null
    if (dy > dismissThreshold || velocity > 0.6) {
      requestClose()
    }
    setDragY(0)
  }

  if (!mounted) return null

  const translate = visible ? dragY : null // null -> pakai transform penuh (tertutup)
  const panelTransform =
    translate === null ? 'translateY(100%)' : `translateY(${translate}px)`
  const transition =
    dragStart.current || reduce
      ? 'none'
      : `transform ${DURATION.base}ms ${EASE_EXPRESSIVE}`

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      {/* Overlay */}
      <div
        onClick={requestClose}
        className="absolute inset-0 bg-slate-950/50"
        style={{
          opacity: visible ? 1 : 0,
          transition: reduce ? 'none' : `opacity ${DURATION.base}ms ease`,
        }}
      />

      {/* Panel */}
      <div
        className={
          desktopPlacement === 'right'
            ? 'absolute inset-x-0 bottom-0 flex justify-center md:justify-end md:pr-6 lg:pr-8 md:pb-6 pointer-events-none'
            : 'absolute inset-x-0 bottom-0 flex justify-center pointer-events-none'
        }
      >
        <div
          ref={panelRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            transform: panelTransform,
            transition,
            maxWidth,
            touchAction: desktopPlacement === 'right' ? 'auto' : 'none',
          }}
          className={[
            'w-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden pointer-events-auto',
            desktopPlacement === 'right'
              ? 'rounded-t-3xl md:rounded-3xl border-t border-x md:border border-slate-200 dark:border-slate-800 max-h-[90dvh] md:max-h-[calc(100dvh-3.5rem)]'
              : 'rounded-t-3xl border-t border-x border-slate-200 dark:border-slate-800 max-h-[90dvh]',
            className,
          ].join(' ')}
        >
          {/* Grabber + header (area drag) */}
          <div
            data-sheet-handle
            className={`shrink-0 ${
              desktopPlacement === 'right'
                ? 'cursor-grab active:cursor-grabbing md:cursor-default'
                : 'cursor-grab active:cursor-grabbing'
            }`}
          >
            <div
              className={`flex justify-center pt-3 pb-1 ${
                desktopPlacement === 'right' ? 'md:hidden' : ''
              }`}
            >
              <span className="h-1 w-9 rounded-full bg-slate-300 dark:bg-slate-600" />
            </div>
            {header ?? (
              (title || subtitle) && (
                <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-1">
                  <div className="min-w-0">
                    {title && (
                      <h3 className="font-display text-h3 font-bold text-slate-900 dark:text-slate-100 truncate">
                        {title}
                      </h3>
                    )}
                    {subtitle && (
                      <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={requestClose}
                    aria-label="Tutup"
                    className="shrink-0 -mr-1 grid place-items-center w-11 h-11 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )
            )}
          </div>

          {/* Konten scrollable */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-4">{children}</div>

          {/* Footer sticky (opsional) dengan safe-area */}
          {footer && (
            <div
              className="shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 pt-3"
              style={{ paddingBottom: 'calc(0.75rem + var(--safe-bottom))' }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BottomSheet
