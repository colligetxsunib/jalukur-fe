/**
 * Environment flags (design.md — app bersih untuk produksi).
 *
 * Dev-tools (pengalih API Live/Fallback, konfigurasi server, persona demo 1-klik)
 * HANYA untuk pengembangan & demo juri — tidak boleh muncul di production build.
 *
 * Aturan:
 *  - `npm run dev`   → import.meta.env.DEV === true  → dev-tools TAMPIL.
 *  - `npm run build` → import.meta.env.PROD === true → dev-tools HILANG (+ tree-shaken).
 *  - Override eksplisit: set VITE_SHOW_DEV_TOOLS="true" | "false" di .env untuk memaksa.
 *    (mis. ingin memperlihatkan persona demo di satu build demo produksi tertentu).
 */

const override = import.meta.env.VITE_SHOW_DEV_TOOLS as string | undefined

/** True bila kontrol khusus pengembang boleh ditampilkan. */
export const DEV_TOOLS: boolean =
  override === 'true' ? true : override === 'false' ? false : !!import.meta.env.DEV

/** Helper fungsi (sama dengan DEV_TOOLS; untuk gaya pemanggilan yang lebih eksplisit). */
export function showDevTools(): boolean {
  return DEV_TOOLS
}
