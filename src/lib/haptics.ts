/**
 * Haptic feedback helper (design.md §3.3).
 *
 * Progressive enhancement: memakai Web Vibration API bila tersedia, jika tidak maka no-op.
 * UX tidak boleh pernah bergantung pada haptic — ini hanya "bumbu" di perangkat yang mendukung.
 *
 * Contoh:
 *   import { haptic, HAPTIC } from '@/lib/haptics'
 *   haptic(HAPTIC.tap)          // tap aksi utama
 *   haptic(HAPTIC.success)      // momen sukses besar
 */

/** Pola getar baku, dipetakan ke event UI (lihat design.md §3.3). */
export const HAPTIC = {
  /** Tap aksi utama / submit. */
  tap: 10,
  /** Pilihan terkonfirmasi (pilih prodi, selesai step). */
  select: 15,
  /** Error / gate gagal. */
  error: [30, 40, 30],
  /** Momen sukses besar (hasil keluar, strategi final). */
  success: [10, 30, 10, 30],
} as const

export type HapticPattern = number | readonly number[]

/** True bila perangkat & browser mendukung getaran. */
export function canVibrate(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.vibrate === 'function'
  )
}

/**
 * Picu getaran. Aman dipanggil di mana saja: tidak melempar error dan menjadi
 * no-op bila API tidak ada, pengguna menonaktifkan, atau browser memblokir.
 */
export function haptic(pattern: HapticPattern = HAPTIC.tap): void {
  if (!canVibrate()) return
  try {
    // navigator.vibrate butuh number | number[] (mutable) → salin bila readonly array.
    navigator.vibrate(Array.isArray(pattern) ? [...pattern] : (pattern as number))
  } catch {
    /* no-op: jangan pernah menggagalkan interaksi karena haptic */
  }
}
