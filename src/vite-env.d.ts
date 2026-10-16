/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Flag bawaan Vite (dideklarasikan eksplisit agar type-check tetap jalan bila
  // "vite/client" belum terpasang; akan merge dengan definisi resmi Vite).
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
  readonly BASE_URL: string;
  readonly SSR: boolean;

  /** Base URL backend FastAPI JalurKu (jalurku-be). */
  readonly VITE_API_BASE_URL?: string;
  /** Mode koneksi: "live" | "demo". Kosong = ikut mode build (dev→demo, build→live). */
  readonly VITE_API_MODE?: string;
  /** Versi consent default untuk pembuatan sesi tamu. */
  readonly VITE_CONSENT_VERSION?: string;
  /** Paksa tampil/sembunyikan dev-tools ("true" | "false"). Default: ikut import.meta.env.DEV. */
  readonly VITE_SHOW_DEV_TOOLS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
