# JalurKu Frontend — Platform Decision Support Pemilihan Jurusan & Strategi SNBP/SNBT 🎓

> **Kategori Lomba:** Software Development / Hackathon JOINTS UGM 2026
> **Nama Tim:** Colliget x Sunib
> **Demo FE (Vercel):** [https://jalurku-fe.vercel.app](https://jalurku-fe.vercel.app)
> **Backend produksi (FastAPI):** [https://jalurku-api.ravedeprinz.me](https://jalurku-api.ravedeprinz.me) (`/api/v1`, cek `GET /health`)
> **Repositori Frontend:** [https://github.com/colligetxsunib/jalurku-fe](https://github.com/colligetxsunib/jalurku-fe)
> **Repositori Backend (FastAPI):** [https://github.com/colligetxsunib/jalurku-be](https://github.com/colligetxsunib/jalurku-be)

> **Status: prototipe demo.** Memakai data persona fiktif. Jangan isi data siswa nyata.
> Konfirmasi hukum soal data anak (UU PDP) dan persetujuan orang tua/wali **belum dilakukan** —
> wajib sebelum peluncuran nyata (lihat README backend bagian Keamanan & Batasan).
> Semua angka kalibrasi di backend berlabel **"indikatif, belum dikalibrasi"**.

---

## 📌 Tentang JalurKu

**JalurKu** adalah platform *Decision Support System* (DSS) berbasis web untuk membantu siswa SMA
kelas 12 dan *gap year* menyusun strategi pilihan program studi lewat jalur **SNBP** dan **SNBT**
(siklus pendaftaran 2026).

Berbeda dari chatbot tanya-jawab biasa atau kalkulator peluang persentase semu, JalurKu memakai:

1. **Mesin aturan deterministik** (bukan LLM) untuk Gate syarat mutlak dan kategori
   `reach / match / safe / belum_ada_acuan` — semua kategori berlabel indikatif.
2. **Tanpa persentase peluang.** Tidak ada klaim probabilitas diterima.
3. **AI Kontekstual (RAG)** yang hanya menjelaskan hasil mesin aturan dan menjawab dari
   **4 dokumen resmi yang benar-benar ter-ingest (103 chunk)** — lihat bagian RAG di bawah.
4. **Privasi sejak awal:** sesi tamu tanpa identitas, tanpa akun, tombol hapus data.
   Dirancang dengan prinsip privasi (tanpa identitas, hapus data); konfirmasi hukum
   sebelum peluncuran nyata.

Antarmuka berupa *Single Page Application* (SPA) *mobile-first*, adaptif *Dark/Light Mode*,
responsif untuk smartphone, tablet, maupun desktop.

---

## 🔌 Mode operasi — wajib dibedakan (Live vs Demo)

Frontend ini punya **Dual-Mode Architecture** (`src/services/api.ts`):

| Mode | Sumber hitungan | Kapan dipakai |
|---|---|---|
| **Live Backend Mode** | REST API FastAPI (`VITE_API_BASE_URL`, produksi `https://jalurku-api.ravedeprinz.me/api/v1`) | Default saat demo daring. Gate, tier, pita, strategi, RAG dihitung backend. |
| **Offline Demo / Smart Fallback Mode** | Algoritma deterministik lokal (`src/services/engine.ts` + `src/data/*`) | Dipakai bila backend tidak terjangkau (timeout 4 dtk, *auto-switch* + toast), atau dipilih manual. Menjamin aplikasi tetap 100% interaktif saat presentasi juri tanpa internet. |

> **Hasil kedua mode bisa berbeda.** Mode demo memakai data katalog/regulasi lokal
> yang disederhanakan untuk keperluan presentasi. **Angka resmi yang dipertanggungjawabkan
> adalah keluaran Live Backend**, bukan mode demo. Indikator mode tampil di header
> (`Live REST` vs `Smart Fallback`) dan bisa diganti lewat modal konfigurasi API.

Preset persona 1-klik (Rani — eksplorasi, Dimas — target spesifik, kasus gugur Gate)
memakai data **fiktif** yang sama dengan `config/personas/*.json` di backend.

---

## 🌟 Fitur (MVP) — sesuai perilaku backend

### 1. Sesi Tamu Anonim & Prinsip Privasi

- **Tanpa pendaftaran rumit**: tanpa email asli, nomor HP, NIK, atau NISN.
  Skema profil backend sengaja tidak memuat kolom identitas (`wni_punya_nik` hanya boolean).
- **Persetujuan eksplisit**: `POST /session` menolak tanpa `consent: true`; backend mencatat
  `consent_at` dan `consent_version`.
- **Token acak, hanya hash yang disimpan** (SHA-256 di kolom `token_hash`, TTL 24 jam,
  72 jam untuk sesi demo persona). Bukan "token terenkripsi".
- **Hak hapus data (*Right to Erasure*)**: tombol "Hapus Data Saya" memanggil
  `DELETE /session` (cascade hapus seluruh data turunan di server) + membersihkan
  `localStorage`. PII disaring sebelum dikirim ke LLM atau dicatat di log.
- ⚠️ **Bukan klaim "kepatuhan penuh UU PDP".** Kalimat yang aman: *"Dirancang dengan
  prinsip privasi (tanpa identitas, hapus data); konfirmasi hukum sebelum peluncuran nyata."*

### 2. Pemetaan Profil Akademik & Minat (tanpa LLM di backend)

- Asal sekolah (38 provinsi, akreditasi A/B/C), nilai rapor 9 mapel semester 1–5,
  peringkat/kuota sekolah, tahun lulus, dan skor *tryout* (lihat catatan What-If).
- **Kuesioner minat terstruktur**: skala 1–5 pada 6 dimensi RIASEC — ini yang dipakai
  backend (`GET /riasec/questions`, `POST /riasec/submit`, `POST /explore`).
  Skoring deterministik, instrumen 36 butir orisinal tim, **belum divalidasi psikometrik
  dan bukan tes psikologi** (setiap hasil membawa pernyataan itu; jawaban mentah
  tidak pernah disimpan).
- **Kolom "cerita bebas" di FE hanya input demo lokal.** Tombol "Ekstrak Tag Minat
  dengan AI" di FE melakukan pencocokan kata kunci sisi-klien, **bukan** LLM backend.
  Backend **sengaja tidak memakai LLM untuk minat**.
- 🗺️ **Roadmap (bukan fitur jalan): AI Story Parser** — ekstraksi narasi bebas menjadi
  profil minat terstruktur via LLM. Jangan didemokan sebagai fitur live.

Rumus eksplorasi backend (deterministik):

```
kecocokan = 0,5 x kemiripan_minat + 0,5 x kesesuaian_nilai
```

### 3. Matriks 2D Kecocokan Minat × Kelayakan Akademis (visualisasi FE)

Visualisasi FE (sumbu Minat 0–100, sumbu Kelayakan 0–100, grid 25 poin, garis
ekuilibrium, 4 kuadran, pin anti-tabrakan, Inspector Panel) adalah **presentasi**
dari skor `/explore` backend. Profil rumpun memakai prioritas: data resmi
(`tag_minat`, `mapel_penentu`, `profesi`) → **data draf** (`data/draft/`,
berlabel *"draf, belum terverifikasi"*) → klasifikasi awal `config/app.yaml`.

### 4. Evaluasi Target 2 Tahap (Gate Mutlak & Kategori Peluang)

- **Tahap 1 — Gate Syarat Mutlak** (13 syarat siklus 2026 dari paparan resmi SNPMB):
  SNBP 8 syarat, SNBT 5 syarat. Status per syarat: `lolos / gagal / data_kurang /
  tidak_berlaku`. Gagal Gate → penilaian `null` (tidak dihitung agar tidak memberi
  harapan palsu).
- **Tahap 2 — Kategori Peluang Objektif (heuristik indikatif, bukan probabilitas):**
  - **SNBT: "Keketatan prodi × kekuatan rapor (proksi)".** Tier siswa (lemah/sedang/kuat)
    dari rata-rata rapor + tren + peringkat; pita keketatan (rendah/sedang/tinggi) dari
    rasio peminat/daya tampung per program (persentil 33/67, min 8 pembanding);
    kategori dari matriks 3×3. **Tidak ada acuan skor resmi** (`acuan_skor_snbt.csv`
    kosong; tidak ada passing grade resmi). Tier SNBT selalu berkeyakinan **rendah**
    karena rapor hanya proksi, bukan skor UTBK.
  - **SNBP:** label **Indikatif** + tingkat keyakinan (rendah/sedang; alumni hanya
    memengaruhi keyakinan/catatan). Belum ada data keketatan SNBP → banyak prodi
    `belum_ada_acuan`.
  - Prodi tanpa data keketatan (semua PTN selain UI + 1 prodi UI; 154 dari 185 prodi)
    → `belum_ada_acuan`, tidak ditebak. Hanya 31 prodi UI yang berdata.

### 5. Simulator Strategi Pilihan & Skenario *What-If*

Aturan **sesuai ketentuan resmi 2026** (dari `config_ketentuan.csv`, bukan angka FE):

- **SNBP maksimal 2 pilihan** (dengan 2 pilihan: salah satu wajib di PTN provinsi sekolah asal).
- **SNBT maksimal 4 pilihan** dengan komposisi vokasi wajib: 1–2 bebas; 3 pilihan =
  2 Sarjana + 1 vokasi / 1 Sarjana + 2 vokasi / 3 vokasi (min 1 D3); 4 pilihan =
  2 Sarjana + 2 vokasi / 1 Sarjana + 3 vokasi (min 1 D3).
- Evaluasi: minimal 1 `safe`, porsi `reach` ≤ 50%, peringatan satu PTN. **Saran swap**
  hanya dari `shortlist` dan hanya bila memperbaiki masalah tanpa menambah masalah baru.

**Catatan What-If skor UTBK (penting):**

- **Di Live Backend, skor tryout DINONAKTIFKAN** (`skala_skor_tryout: null` di
  `config/app.yaml`). Mengirim `override.skor_tryout` **tidak memengaruhi kategori**.
- **Slider What-If skor UTBK 400–800 di FE hanya berfungsi di Offline Demo Mode**
  (algoritma lokal `engine.ts`). Di mode live, slider ini tidak mengubah status.
- What-if yang **didukung mode live**: ganti pilihan/shortlist, `override` nilai rapor,
  dan evaluasi ulang tanpa menyimpan (`simpan: false`).

### 6. Ringkasan Strategi Siap Cetak (A4) & AI Kontekstual RAG

- **Cetak 1 halaman A4**: ringkasan dari strategi tersimpan (`POST /summary`),
  dioptimalkan `@media print`. Narasi dari template; LLM hanya boleh menyusun ulang
  dari fakta mesin aturan dan hanya dipakai bila lolos pagar keluaran. Tidak ada
  tautan berbagi publik.
- **Drawer AI Kontekstual (RAG) — basis yang benar-benar di-ingest:**

| dokumen_id | Judul | Chunk |
|---|---|---|
| `snpmb-paparan-2026` | Paparan Informasi SNPMB 2026 untuk Peluncuran | 20 |
| `snpmb-sipers-2026` | Siaran Pers Peluncuran SNPMB 2026 | 4 |
| `unej-panduan-snbp-2026` | Panduan SNBP 2026 (Universitas Jember) | 40 |
| `unej-panduan-snbt-2026` | Panduan UTBK-SNBT 2026 (Universitas Jember) | 39 |
| **Total ter-ingest** | **4 dokumen** | **103 chunk** |

Dokumen kelima (`snpmb-faq`, halaman web Halo SNPMB) **belum diunduh dan tidak ada
di basis RAG**; ingest melewatinya (`[LEWATI]`). Klaim FE sebelumnya yang menyebut
"POB SNBP/SNBT, Kepmendikbudristek No. 345/M/2024, Permendikbudristek No. 48/2022"
sebagai basis RAG **tidak tepat** — dokumen-dokumen itu tidak ada di
`dokumen_rag_metadata.csv` maupun di hitungan 103 chunk. Penyebutan regulasi di
jawaban RAG berasal dari isi keempat dokumen di atas, lengkap dengan sitasi
judul/URL/halaman dari metadata chunk (bukan karangan LLM). Pertanyaan keputusan
pribadi ("aku lolos nggak?") dijawab mesin aturan, bukan LLM; di luar cakupan
dijawab `yakin: false`.

---

## 🛠️ Arsitektur & Teknologi

* **Framework UI:** React 19 + TypeScript
* **Build Tool & Bundler:** Vite (*tree-shaking* optimal)
* **Styling & Desain:** Tailwind CSS (Mobile-First, Adaptive Dark/Light Mode via class `.dark`, layout 100dvh)
* **Iconography:** Lucide React
* **Layer Komunikasi API (`src/services/api.ts`)**: Dual-Mode (Live vs Smart Fallback, lihat tabel di atas).
* **Model AI (backend, bukan FE):** Gemini **model flash-lite** — `LLM_MODEL=gemini-flash-lite-latest`
  + cadangan `LLM_MODEL_FALLBACK=gemini-3.1-flash-lite` (timeout 10 dtk, rantai: ulangi sekali
  bila 503 → model cadangan → teks template). Bawaan `gemini-2.5-flash` di `app.yaml`
  sudah 404; jangan sebut `gemini-1.5-flash / 2.5-flash` sebagai model jalan.
  Embedding dikunci `gemini-embedding-001` 768 dimensi. Tanpa `GEMINI_API_KEY`,
  keputusan tetap jalan dengan teks cadangan (`fallback: true`).
* **Status tes (milik backend, jangan diklaim hijau di FE):** terakhir hijau **978/978**
  pada 15 Okt 2026 (tag `v1.2-submit`, sebelum edit pemilik data). **Saat ini 23 gagal +
  2 error pengumpulan**, semuanya `PersonaError` dari format tanggal verifikasi di
  `config/personas/rani.json` (kode tidak berubah sejak terakhir hijau).
  Golden gate 33/33 dan RAG proksi 11/13 dalam-cakupan adalah **kunci regresi**,
  bukan bukti kebenaran independen (lihat `docs/fakta_pitch.md` backend).

---

## 💻 Panduan Menjalankan Aplikasi di Lokal

### Prasyarat

- **Node.js** v18+ atau v20+
- **npm** (atau **bun** / **yarn** / **pnpm**)
- Backend lokal (opsional, untuk Live Mode): lihat README backend
  (`docker compose up -d db`, `uv sync`, `alembic upgrade head`, `scripts.ingest`,
  `uvicorn app.main:build_app --factory --port 8000`)

### Langkah Instalasi

```bash
# 1. Clone repositori ini
git clone https://github.com/colligetxsunib/jalurku-fe.git

# 2. Masuk ke direktori proyek
cd jalurku-fe

# 3. Salin template variabel lingkungan
cp .env.example .env
# Isi VITE_API_BASE_URL:
# - Lokal:  http://localhost:8000/api/v1
# - Produksi: https://jalurku-api.ravedeprinz.me/api/v1

# 4. Install dependensi
npm install

# 5. Jalankan development server
npm run dev
```

Buka peramban Anda di `http://localhost:5173` (atau port yang ditampilkan di terminal).

### Perintah Build & Produksi

```bash
# Uji tipe data dan kompilasi bundle produksi
npm run build

# Menjalankan preview hasil kompilasi
npm run preview
```

### Deploy

- FE produksi: **https://jalurku-fe.vercel.app** (Vercel).
  Set `VITE_API_BASE_URL=https://jalurku-api.ravedeprinz.me/api/v1` di environment Vercel
  agar default-nya Live Backend, bukan localhost.

---

## 🤖 Transparansi Penggunaan Generative AI (Ketentuan JOINTS 2026)

Sesuai ketentuan etika dan transparansi kompetisi **JOINTS UGM 2026**, tim
**Colliget x Sunib** menyatakan secara terbuka:

1. **AI-Assisted Interface & Layout Development (FE):**
   Pengembangan komponen antarmuka, tata letak responsif, integrasi tema Dark/Light mode,
   dan perapian CSS dibantu model AI (**Google Gemini**, **Lovable**, dan
   **Antigravity AI IDE**) sebagai mitra *pair programming*.
2. **AI-Assisted Backend Development (BE):** pengembangan backend dibantu
   **Kiro** dan **OpenCode** (mostly Kiro + OpenCode).
3. **AI Engine (live, via backend FastAPI):** hanya dua pemakaian LLM yang live —
   **Contextual RAG Q&A** (penjelasan hasil + tanya-jawab dari 4 dokumen resmi di atas)
   dan **narasi ringkasan** (disusun ulang dari fakta mesin aturan, lolos pagar keluaran),
   memakai **Gemini (model flash-lite)** dengan rantai cadangan. Keputusan
   (Gate, tier, pita, kategori, strategi) **100% deterministik, tanpa LLM**.
   Tes minat RIASEC dan `/explore` juga tanpa LLM.
4. **Bukan fitur live: AI Story Parser.** Ekstraksi minat dari narasi bebas via LLM
   ( PRD backend bagian 17 #6 / backlog) **belum diimplementasikan** dan masuk
   **roadmap**. Input cerita bebas di FE saat ini hanya ekstraksi kata kunci lokal.

Seluruh arsitektur sistem, aturan validasi syarat mutlak (*Gate*), rumus pembobotan
deterministik, struktur basis data katalog PTN/Prodi, dan kurasi dokumen RAG disusun
dan diverifikasi langsung oleh tim pengembang. Data katalog (10 PTN, 185 prodi;
31 prodi UI berdata keketatan) dan dokumen RAG **belum seluruhnya diverifikasi manusia**
(`status_verifikasi: belum_diverifikasi`); tanggal verifikasi hanya diisi manusia,
tidak pernah otomatis.

---

## 🗺️ Roadmap

- Ingest `snpmb-faq` + perluas data keketatan ke PTN selain UI.
- Validasi instrumen RIASEC bersama guru BK; backtest kategori dengan data tahun lalu.
- **AI Story Parser** (cerita bebas → profil minat terstruktur via LLM) — setelah
  minat dasar stabil dan ada persetujuan privasi.
- Kalibrasi bobot/batas/matrik (`config/app.yaml`) dengan data empiris.

---

## 👥 Tim Pengembang (Colliget x Sunib)

Dikembangkan dengan dedikasi untuk memajukan pemerataan akses informasi pendidikan tinggi
bagi seluruh calon mahasiswa Indonesia.

* **JOINTS UGM 2026 — Software Development Competition**
