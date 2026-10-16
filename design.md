# JalurKu — Design System & UI/UX Guideline (`design.md`)

> **Single Source of Truth** untuk seluruh tim engineer & desainer JalurKu.
> **Target pengguna:** siswa SMA/MA/SMK kelas 12 & gap year (15–19 th), Indonesia.
> **Platform utama:** Mobile Web (HP), **Mobile-First** mutlak. Desktop = tampilan terpusat (device-frame), bukan dashboard lebar.
> **Stack:** React 19 + TypeScript + Vite + Tailwind CSS v4 + Lucide React + canvas-confetti.
> **Arah desain:** **"Warm E-Learning"** — cream hangat, hijau hutan, aksen amber, kartu neo-brutalism bergaya aplikasi belajar yang playful & memotivasi. Light-first.

---

## 0. North Star (acuan visual wajib)

Desain JalurKu **mengikuti bahasa visual aplikasi e-learning modern** (dashboard belajar dengan progress, streak, gamifikasi ringan). Rasanya **hangat, ramah, memotivasi** — bukan dashboard korporat, bukan dark-glassy.

Ciri wajib yang harus selalu ada:
- **Latar cream/sand hangat** (bukan putih steril, bukan gelap).
- **Kartu cream solid** dengan **border tegas coklat-tua** + **bayangan offset solid** (bukan blur, bukan glass).
- **Hijau hutan** untuk kartu "hero" (mis. streak/progress) dan navigasi aktif.
- **Aksen amber/kuning** untuk highlight (hari aktif, api streak, bintang rating, badge).
- **Angka statistik besar & berwarna** (tiap metrik beda warna), gaya "47h / 6 / 3".
- **Progress bar** dengan isi oranye-bata.
- **Bottom navigation** dengan item aktif berupa pill hijau + label.
- Banyak ruang napas, sudut membulat, tipografi bulat ramah.

> **Litmus test:** jika sebuah layar terasa seperti "form admin di latar gelap", itu SALAH. Harus terasa seperti **app belajar yang bikin semangat**.

---

## Daftar Isi
1. [Design Philosophy](#1-design-philosophy)
2. [Color Palette & Typography](#2-color-palette--typography)
3. [Micro-interactions, Gestures & Motion](#3-micro-interactions-gestures--motion)
4. [UX Principles for Gen-Z](#4-ux-principles-for-gen-z)
5. [Component Anatomy](#5-component-anatomy)
6. [Layout & App Shell](#6-layout--app-shell)
7. [API Integration Layer](#7-api-integration-layer)
8. [Design Tokens Reference (Tailwind v4)](#8-design-tokens-reference)

---

## 1. Design Philosophy

### 1.1 Visi
JalurKu menangani keputusan berat (jurusan kuliah) tapi harus terasa **ringan, memotivasi, dan memihak siswa** — seperti aplikasi belajar yang kamu buka tiap hari karena nyaman, bukan portal birokrasi. Keputusan tetap **deterministik & bisa dipertanggungjawabkan** (lihat PRD); yang kita ubah adalah **pembungkusnya** jadi pengalaman belajar yang hangat & terstruktur.

### 1.2 Arah visual: **Warm E-Learning Neo-Brutalism**
- **Warm & cream**: latar sand/cream, kartu cream, teks hijau-gelap. Menenangkan, ramah dibaca lama.
- **Neo-brutalism lembut**: setiap kartu/tombol punya **border coklat-tua** + **shadow offset solid** → terasa tactile & "bisa dipencet", bukan flat/glass.
- **Gamifikasi terlihat**: streak, progress ring/bar, stat besar, badge — mendorong siswa menyelesaikan alur.
- **Hierarki warna jelas**: hijau = aksi/positif/navigasi; amber = highlight/pencapaian; oranye-bata = angka utama/progress; coklat = garis & bayangan.

### 1.3 Yang DILARANG (anti-pattern)
- ❌ Latar gelap sebagai default / glassmorphism / blur tebal.
- ❌ Gradient ungu-biru generik ala SaaS.
- ❌ Shadow blur lembut tanpa border (kesan "melayang generik").
- ❌ Layout dashboard lebar dengan stepper horizontal 6-kolom yang padat.
- ❌ Warna semantik dipakai di luar maknanya.

### 1.4 Tone & Voice
Bahasa Indonesia **kasual-sopan & memotivasi**, seperti mentor/kakak kelas yang asik. Sapaan "kamu". Rayakan progress ("Mantap, 3 dari 5 selesai!"). Jujur saat tak yakin. Emoji fungsional, hemat.

---

## 2. Color Palette & Typography

### 2.1 Palet inti (HEX pasti — turunkan dari referensi)

**Permukaan hangat**
| Token | Nama | HEX | Pakai |
|------|------|-----|-------|
| `--color-cream` | Sand/App BG | `#EDE4CF` | Latar aplikasi (area di luar kartu) |
| `--color-cream-card` | Card BG | `#FBF7EC` | Latar kartu & konten |
| `--color-cream-sunk` | Sunken | `#F0E8D5` | Field input, track, area nested |
| `--color-ink` | Ink (teks) | `#243027` | Teks utama (hijau-gelap gelap) |
| `--color-stroke` | Stroke/Border | `#2F2A1E` | Border kartu, outline, bayangan offset |

**Hijau (brand & aksi)**
| Token | HEX | Pakai |
|------|-----|-------|
| `--color-brand-700` | `#1C3A2A` | Hijau sangat gelap: judul kuat, teks di atas amber |
| `--color-brand-600` | `#235C3D` | Hover/pressed |
| `--color-brand-500` | `#2E6E4E` | **Primary**: kartu hero (streak), nav aktif, CTA |
| `--color-brand-200` | `#A9C6B3` | Tint ringan |
| `--color-brand-100` | `#DCE8DF` | Background chip hijau |
| `--color-brand-50` | `#EDF3EE` | Tint paling ringan |

**Aksen**
| Token | HEX | Pakai |
|------|-----|-------|
| `--color-amber` | `#E8B84B` | Highlight: hari aktif, api streak, bintang, badge "today" |
| `--color-amber-soft`| `#F6E2A6` | Latar highlight amber lembut |
| `--color-brick` | `#C85A3C` | **Angka utama** (mis. "47h"), progress-fill, badge "Advanced" |
| `--color-teal` | `#2F7E8C` | Aksen info sekunder (hemat) |

**Semantik produk (reach/match/safe/gate) — WAJIB konsisten**
| Makna | Token | HEX |
|------|------|-----|
| SAFE (aman) | `--color-safe` | `#2E6E4E` (hijau brand) |
| MATCH (kompetitif) | `--color-match` | `#2F7E8C` (teal) |
| REACH (tantangan) | `--color-reach` | `#C85A3C` (bata) |
| GATE gagal | `--color-danger` | `#B23A2E` (merah bata tua) |
| Belum ada acuan / indikatif | `--color-muted` | `#8A8268` (khaki) |

> Aturan: maksimal gunakan **hijau + amber + bata** sebagai trio utama per layar. Teal & khaki hanya pendukung.

### 2.2 Dark mode (opsional)
Bukan default. Latar gelap kehijauan hangat (`#17201A` app, `#1F2A22` card, teks cream). Aktif hanya via toggle (`.force-dark`). **Default aplikasi SELALU light.**

### 2.3 Typography
- **Display / Heading:** font bulat-tebal ramah. Prioritas: `"Plus Jakarta Sans"` (sudah di-load) dengan weight 700–800; opsi upgrade `"Clash Display"`/`"Fraunces"` bila ingin karakter lebih kuat.
- **Body / UI:** `"Plus Jakarta Sans"`, weight 400–600.
- **Angka stat & data:** `"JetBrains Mono"` (tabular-nums) agar sejajar & tegas.

**Type scale (mobile-first):**
| Token | Size / LH | Weight | Pakai |
|------|-----------|--------|-------|
| `display` | 2.5rem / 1.05 (40px) | 800 | Angka hero stat ("47h") |
| `h1` | 1.75rem / 1.15 (28px) | 800 | Nama/sapaan ("Alex Morgan") |
| `h2` | 1.25rem / 1.25 (20px) | 700 | Judul section ("Continue Learning") |
| `h3` | 1.0625rem / 1.35 (17px) | 700 | Judul kartu |
| `body` | 1rem / 1.55 (16px) | 400 | Body (min 16px, anti auto-zoom) |
| `sm` | 0.875rem / 1.5 (14px) | 500 | Caption/meta |
| `xs` | 0.75rem / 1.4 (12px) | 600 | Label kecil, hari, badge |

Aturan: body ≥ 16px; angka penting pakai mono + warna semantik; "See all" = teks hijau kecil di kanan judul section.

---

## 3. Micro-interactions, Gestures & Motion

### 3.1 Prinsip
Motion harus **bermakna & cepat** (120–240ms mikro, ≤400ms transisi halaman). Easing masuk `cubic-bezier(0.22,1,0.36,1)`. Spring untuk elemen playful (badge, streak, confetti).

### 3.2 Feedback (visual + haptic)
- **Tap**: `scale(0.96)` + bayangan offset "turun" (tombol brutal: `translate(2px,2px)` + shadow hilang → kesan tertekan).
- **Sukses/pencapaian** (profil lengkap, hasil keluar, streak naik): micro-pop + **confetti** (hemat) + `haptic(success)`.
- **Loading**: skeleton bentuk-konten (bukan spinner kosong).
- **Error/gate gagal**: shake halus + `haptic(error)` + pesan manusiawi.
- **Haptic** (Web Vibration API, progressive): tap=10, select=15, error=[30,40,30], success=[10,30,10,30]. Selalu optional (no-op bila tak didukung).

### 3.3 Gestures
| Gesture | Perilaku | Konteks |
|--------|----------|---------|
| Tap | target ≥ 44×44pt | semua elemen |
| Swipe horizontal | carousel kartu | "Recommended for You", item minat |
| Pull-to-refresh | muat ulang | katalog/rekomendasi |
| Long-press | aksi sekunder/peek | kartu prodi → quick-add |
| Drag | slider & reorder | What-If skor, urutan pilihan |
| Swipe-down | tutup | Bottom Sheet / drawer |

Semua gesture **wajib ada alternatif tombol**. Hormati `prefers-reduced-motion` (ganti translasi besar → fade ≤120ms).

---

## 4. UX Principles for Gen-Z

### 4.1 Friction rendah
- Masuk **tanpa signup** (sesi tamu, consent 1 ketuk).
- **Progressive disclosure**: satu fokus per layar; boleh skip & lengkapi nanti (profil parsial didukung backend).
- Default pintar; dev-tools (persona demo, switch API) **hanya tampil di mode pengembang**, hilang di production.

### 4.2 Gamifikasi (seperti referensi)
- **Streak harian** (strip hari S-M-T-W-T-F-S, hari ini di-highlight amber) + "X-Day Streak!" dengan ikon api — opsional/future, tapi polanya jadi acuan "hero card".
- **Progress nyata**: bar "68% complete", stat "47h Learned / 6 Enrolled / 3 Done".
- **Badge & label** sebagai status, bukan kompetisi.
- **Perayaan** di milestone (confetti + microcopy).

### 4.3 Ergonomi thumb-first
- Aksi utama di **bawah** (sticky bottom bar / bottom sheet), dalam jangkauan jempol; hormati `env(safe-area-inset-bottom)`.
- **Bottom Navigation** 3–5 ikon, aktif = pill hijau + label (ikon Lucide).
- Pola **Bottom Sheet** untuk pilihan/detail/konfirmasi (grabber bar, swipe-down).

### 4.4 Kepercayaan & kejujuran (domain-kritis)
- Angka/kategori selalu berlabel ("indikatif", "acuan siklus lalu", "belum ada acuan"). Tanpa persentase peluang semu.
- Gate gagal tegas tapi empatik (bata + penjelasan + jalan keluar), tanpa menampilkan kategori.
- Tombol **"Hapus Data Saya"** selalu ada. Jawaban AI selalu bersitasi; jujur saat tak yakin.

### 4.5 Aksesibilitas
Kontras AA, target ≥44pt, fokus terlihat, label input, dukung `prefers-reduced-motion`. Makna tak boleh hanya lewat warna (reach/match/safe + ikon/teks).

---

## 5. Component Anatomy

### 5.1 Token fisik
| Properti | Nilai |
|---------|-------|
| Touch target min | **44×44pt** |
| Spacing | 4 / 8 / 12 / 16 / 20 / 24 / 32 |
| Radius | `sm 12px`, `md 16px`, `lg 20px`, `xl 24px`, `pill 9999px`. Kartu utama = `lg/xl`. |
| Border | **1.5–2px**, warna `--color-stroke` (coklat-tua), **selalu ada** di kartu & tombol utama |
| Shadow offset | `3px 3px 0 0 var(--color-stroke)` (solid, bukan blur) |
| Shadow soft | `0 2px 10px rgba(36,48,39,.08)` (pelengkap, bukan pengganti border) |
| Ikon | Lucide, stroke 2px, 20–24px, `currentColor` |

### 5.2 Katalog komponen (bentuk wajib)

**StatCard** (seperti "47h / 6 / 3")
- Kartu cream, border stroke, shadow offset, radius `lg`.
- Angka **besar (display, mono)** berwarna (bata/hijau/hijau-gelap) + label kecil uppercase di bawah.
- Dipakai sebagai strip 3 kolom.

**HeroCard** (seperti kartu Streak hijau)
- Background **hijau brand**, teks cream/amber, radius `xl`, border stroke.
- Boleh memuat strip hari (kotak amber untuk "hari ini") + ikon api + CTA ringan.

**Button**
- `primary`: bg hijau brand, teks cream, border stroke 2px, **shadow offset**, radius `md`, min-h 48–52px; `active` → translate(2px,2px) + shadow hilang.
- `amber` (highlight CTA): bg amber, teks ink.
- `secondary`: bg cream-card, border stroke, teks ink.
- `ghost`: tanpa bg.
- `danger`: bg/outline merah-bata (gate/hapus).

**CourseCard / ProdiCard** (seperti "Continue Learning")
- Thumbnail kiri (radius md), judul + subjudul, **progress bar bata** + "% complete", badge kanan-atas (pill bata "Advanced").

**RecommendCard** (carousel "Recommended for You")
- Gambar atas, judul, meta rating (bintang amber) + durasi. Swipe horizontal.

**ContentListItem** (seperti layar "Contents")
- Ikon status bulat (hijau = selesai, abu = terkunci + gembok, bata = kuis), judul + durasi/jumlah soal, divider tipis.

**Chip/Tag/Pill** — pill, border stroke tipis, teks kecil; kategori reach/match/safe pakai warna semantik + ikon.

**Bottom Sheet** — radius atas `xl`, grabber bar, overlay gelap transparan, swipe-down, header sticky, footer CTA + safe-area.

**Bottom Nav** — bar cream, border-top stroke; item aktif = **pill hijau** (ikon + label), item lain ikon ghost.

**Input / Select** — bg cream-sunk, border stroke 2px, radius md, fokus → border hijau + ring; **font 16px**.

**Skeleton / Empty / Error** — skeleton bentuk-konten; empty/error = ilustrasi/emoji + 1 kalimat jujur + 1 CTA.

---

## 6. Layout & App Shell

> Ini perubahan **struktural** dari versi lama (header + stepper 6-kolom dashboard). Tujuan: terasa seperti **mobile app**, bukan web dashboard.

### 6.1 Kerangka
- **Lebar konten mobile dibatasi** (`max-w-[480px]`, center). Di desktop, konten tetap di tengah dengan latar sand di sisi (kesan "device frame"), **bukan** melebar penuh.
- **Top bar ringan**: kiri = sapaan + nama/brand; kanan = ikon (notifikasi/tema). Tidak ada deretan tombol dev di produksi.
- **Progress alur**: ganti stepper 6-kolom padat → **progress bar tipis + label langkah** ("Langkah 2 dari 6 · Profil & Minat"). Opsional: strip langkah yang bisa di-scroll sebagai chip.
- **Konten**: tumpukan kartu bento vertikal, satu fokus utama per layar.
- **Aksi utama**: sticky bottom bar (CTA primary) dengan safe-area.
- **(Opsional/arah akhir)** Bottom navigation bila alur berevolusi jadi berbasis tab.

### 6.2 Pola halaman standar
```
[ Top bar: "Halo, kamu 👋"            (🔔) ]
[ Progress tipis: ======----  Langkah 2/6 ]
[ Hero / Stat strip                      ]
[ Kartu konten (bento, vertikal)         ]
[ ...                                     ]
[ Sticky bottom: [ CTA utama → ]         ]
```

---

## 7. API Integration Layer

Mengikuti kontrak backend `jalurku-be` (dual-mode `live`/`demo` + auto-fallback). Setiap endpoint punya 4 state UI wajib: **loading (skeleton)**, **success**, **empty/belum-ada-acuan**, **error/offline**. Dev-tools (switch mode, persona) **hanya di `import.meta.env.DEV`** / override `VITE_SHOW_DEV_TOOLS`.

| Endpoint | Layar/komponen | Catatan |
|---|---|---|
| `GET /health` | indikator koneksi (dev only) | — |
| `POST/GET/DELETE /session` | onboarding consent, "Hapus Data" | sesi tamu |
| `GET/PUT /profile` | Profil (parsial) | tampilkan `data_kurang` sebagai checklist |
| `GET /catalog/*` | katalog & detail prodi | skeleton, pull-to-refresh |
| `GET /riasec/questions` | **Tes Minat — kuesioner** | render item + skala Likert dari server |
| `POST /riasec/submit` | **Tes Minat — hasil** | vektor 6-dimensi + Holland code, confetti |
| `POST /riasec/cerita` | (jalur AI, disembunyikan sementara) | handle `yakin:false`/`fallback` |
| `POST /explore` | Matriks kecocokan × kelayakan | carousel/kartu |
| `POST /analyze` | Gate → reach/match/safe | gate gagal (danger) vs kategori |
| `POST /strategy` | Simulator What-If | slider real-time, saran swap |
| `POST /summary` | Ringkasan A4 siap cetak | `@media print` |
| `POST /query` | Drawer AI "Kenapa?" (RAG) | bottom sheet, sitasi wajib |

Prinsip: angka/kategori selalu dari engine deterministik (server/fallback), bukan dikarang di UI. Degradasi mulus = fitur desain (badge "Mode Demo" halus, bukan error menakutkan).

---

## 8. Design Tokens Reference (Tailwind v4)

> Deklarasikan di `src/index.css` dalam `@theme`. Light-first: `dark:` variant hanya aktif via kelas `.force-dark` (toggle), **tidak** mengikuti preferensi OS. Skala `slate`/`blue`/`emerald` lama **di-remap** ke palet hangat agar komponen lama otomatis konsisten.

```css
@theme {
  /* Permukaan hangat */
  --color-cream: #EDE4CF;        /* app background */
  --color-cream-card: #FBF7EC;   /* card */
  --color-cream-sunk: #F0E8D5;   /* input/track/nested */
  --color-ink: #243027;          /* teks utama */
  --color-stroke: #2F2A1E;       /* border & shadow offset */

  /* Hijau brand */
  --color-brand-50:  #EDF3EE;
  --color-brand-100: #DCE8DF;
  --color-brand-200: #A9C6B3;
  --color-brand-500: #2E6E4E;    /* primary */
  --color-brand-600: #235C3D;
  --color-brand-700: #1C3A2A;

  /* Aksen */
  --color-amber: #E8B84B;
  --color-amber-soft: #F6E2A6;
  --color-brick: #C85A3C;        /* angka utama, progress, badge */
  --color-teal: #2F7E8C;

  /* Semantik produk */
  --color-safe:  #2E6E4E;
  --color-match: #2F7E8C;
  --color-reach: #C85A3C;
  --color-danger:#B23A2E;
  --color-muted: #8A8268;

  /* Radius */
  --radius-sm: 12px; --radius-md: 16px; --radius-lg: 20px; --radius-xl: 24px; --radius-pill: 9999px;

  /* Motion */
  --ease-expressive: cubic-bezier(0.22, 1, 0.36, 1);
  --dur-instant:100ms; --dur-fast:160ms; --dur-base:240ms; --dur-slow:360ms;

  /* Fonts */
  --font-sans: "Plus Jakarta Sans", system-ui, sans-serif;
  --font-display: "Plus Jakarta Sans", "Clash Display", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  /* Shadows */
  --shadow-soft: 0 2px 10px rgba(36, 48, 39, 0.08);
  --shadow-brutal: 3px 3px 0 0 var(--color-stroke);

  /* Type scale */
  --text-display: 2.5rem;   --text-display--line-height: 1.05;
  --text-h1: 1.75rem;       --text-h1--line-height: 1.15;
  --text-h2: 1.25rem;       --text-h2--line-height: 1.25;
  --text-h3: 1.0625rem;     --text-h3--line-height: 1.35;
}

/* REMAP skala lama -> palet hangat (agar ratusan class slate/blue/emerald ikut tema) */
@theme {
  --color-slate-50:#EDE4CF; --color-slate-100:#F0E8D5; --color-slate-200:#E3D8BE;
  --color-slate-300:#D2C4A3; --color-slate-400:#9C9178; --color-slate-500:#6E6752;
  --color-slate-600:#574F3E; --color-slate-700:#3C372A; --color-slate-800:#2A2820;
  --color-slate-900:#243027; --color-slate-950:#161C14;
  /* blue/indigo/emerald -> hijau brand (lihat index.css untuk daftar lengkap) */
}

/* Light-first: nonaktifkan dark kecuali .force-dark */
@custom-variant dark (&:where(.force-dark, .force-dark *));

:root { --safe-bottom: env(safe-area-inset-bottom, 0px); --safe-top: env(safe-area-inset-top, 0px); }

@layer base {
  body { background: var(--color-cream); color: var(--color-ink); }
}
```

**Aturan praktis engineer:**
- Mobile-first; container `max-w-[480px] mx-auto`.
- Kartu utama: `bg-[var(--color-cream-card)] border-2 border-[var(--color-stroke)] shadow-[var(--shadow-brutal)] rounded-[var(--radius-lg)]`.
- Tombol primary brutal: `bg-brand-500 text-[var(--color-cream)] border-2 border-[var(--color-stroke)] shadow-[var(--shadow-brutal)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`.
- Angka stat: `font-mono tabular-nums text-[var(--color-brick)]` (atau hijau).
- Progress fill: `bg-[var(--color-brick)]`; track: `bg-[var(--color-cream-sunk)]`.
- Sticky bottom: `fixed inset-x-0 bottom-0 pb-[calc(0.75rem+var(--safe-bottom))]`.

---

## Checklist "Siap Rilis per Layar" (PR review)
- [ ] Latar cream (bukan gelap), kartu cream + border stroke + shadow offset.
- [ ] Trio warna hijau/amber/bata dominan; semantik dipakai sesuai makna + ikon/teks.
- [ ] Aksi utama di zona jempol (sticky bottom / bottom sheet) + safe-area.
- [ ] Touch target ≥ 44×44pt; body ≥ 16px.
- [ ] 4 state: loading/success/empty/error. Angka berlabel kejujuran.
- [ ] Dev-tools tidak muncul di production.
- [ ] `prefers-reduced-motion` dihormati; kontras AA.
- [ ] Terasa seperti **app belajar yang memotivasi**, bukan form admin.
