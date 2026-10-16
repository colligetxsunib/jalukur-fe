/**
 * Motion & easing constants (design.md §3.1–§3.2).
 *
 * Single source of truth untuk durasi/easing animasi yang dipakai di JS/inline-style
 * atau Web Animations API. Untuk animasi berbasis class, gunakan token Tailwind
 * (mis. `duration-[160ms] ease-[cubic-bezier(0.22,1,0.36,1)]`) yang nilainya sama.
 *
 * Durasi mobile: 120–240ms untuk mikro-interaksi, max ~400ms untuk transisi halaman.
 */

/** Easing ekspresif untuk elemen masuk (ease-out). */
export const EASE_EXPRESSIVE = 'cubic-bezier(0.22, 1, 0.36, 1)'

/** Durasi standar (ms). Selaras dengan --dur-* di index.css. */
export const DURATION = {
  instant: 100, // tap feedback, toggle
  fast: 160, // hover, chip select, accordion
  base: 240, // kartu masuk, bottom sheet buka
  slow: 360, // transisi antar-step, modal
} as const

export type DurationKey = keyof typeof DURATION

/** True bila pengguna meminta pengurangan gerak (design.md §3.5 — wajib dihormati). */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}
