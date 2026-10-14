# JalurKu Frontend — Platform Decision Support Pemilihan Jurusan & Strategi SNBP/SNBT 🎓

> **Kategori Lomba:** Software Development / Hackathon JOINTS UGM 2026  
> **Nama Tim:** Colliget x Sunib  
> **Repositori Frontend:** [https://github.com/colligetxsunib/jalurku-fe](https://github.com/colligetxsunib/jalurku-fe)  
> **Repositori Backend (FastAPI):** [https://github.com/colligetxsunib/jalurku-be](https://github.com/colligetxsunib/jalurku-be)  

---

## 📌 Tentang JalurKu

**JalurKu** adalah platform *Decision Support System* (DSS) berbasis web yang dirancang khusus untuk membantu siswa SMA kelas 12 dan *gap year* di Indonesia dalam menentukan jurusan kuliah dan menyusun portofolio strategi seleksi masuk perguruan tinggi negeri (**SNBP** dan **SNBT**).

Berbeda dari sekadar *chatbot* tanya-jawab biasa atau kalkulator peluang probabilistik semu yang menyesatkan, JalurKu mengombinasikan **aturan resmi SNPMB BPPP Kemdikbudristek**, **perhitungan deterministik berbasis data acuan historis**, **analisis kelayakan bertahap (Gate & Peluang)**, serta **AI Kontekstual berbasis dokumen resmi (Retrieval-Augmented Generation / RAG)** dengan jaminan privasi penuh (kepatuhan UU Perlindungan Data Pribadi / UU PDP).

Antarmuka dirancang dengan pendekatan *Single Page Application* (SPA) *mobile-first*, adaptif *Dark/Light Mode*, serta tata letak responsif untuk kenyamanan akses di smartphone, tablet, maupun komputer desktop.

---

## 🌟 Nilai Jual Utama & Fitur Unggulan (MVP)

### 1. Sesi Tamu Anonim & Kepatuhan Privasi Penuh (UU No. 27/2022 - UU PDP)
- **Tanpa Pendaftaran Rumit**: Siswa tidak diwajibkan mendaftar dengan email asli, nomor HP, NIK, atau NISN.
- **Persetujuan Eksplisit Sesi Tamu**: Sesi berjalan menggunakan token tamu acak terenkripsi (`guest_...`).
- **Hak Hapus Data (*Right to Erasure*)**: Tombol "Hapus Data Saya" tersedia permanen di header untuk membersihkan seluruh data profil, nilai rapor, dan preferensi seketika dari penyimpanan lokal (*client-side*) maupun sesi server.

### 2. Pemetaan Profil Akademik & Ekstraksi Minat Ganda
- Mendukung pemetaan asal sekolah (38 provinsi dan akreditasi A/B/C).
- Pencatatan nilai rapor 9 mata pelajaran dan skor *tryout* UTBK.
- **Ekstraksi Minat Fleksibel**:
  - *Kuesioner Cepat*: Skala minat pada 6 domain karier/keilmuan.
  * *AI Story Parser*: Siswa dapat menulis cerita minat atau hobi secara bebas (contoh: *"Saya suka membongkar kode komputer dan membuat web"*), yang kemudian diekstraksi menjadi kata kunci/tag minat terstruktur oleh LLM.

### 3. Matriks 2D Kecocokan Minat × Kelayakan Akademis
- Algoritma pencocokan deterministik berbasis PRD:
  $$\text{Kecocokan} = 0.5 \times \text{Kemiripan Minat} + 0.5 \times \text{Kesesuaian Nilai}$$
- **Visualisasi Matriks Analitik 2-Kolom**:
  - Sumbu X: Minat & Bakat (0–100)
  - Sumbu Y: Kelayakan Akademis (0–100)
  - Garis bantu *grid* setiap 25 poin, garis ekuilibrium netral `(50, 50)`, serta pemetaan 4 kuadran semantik (*Kuadran Ideal*, *Minat Tinggi/Tantangan*, *Realistis*, dan *Pertimbangkan Ulang*).
  - Dilengkapi sistem pin anti-tabrakan (*safe bounding box*) dan *Inspector Panel* interaktif dengan perincian mata pelajaran pendukung serta prospek profesi.

### 4. Evaluasi Target 2 Tahap (Gate Mutlak & Kategori Peluang)
- **Tahap 1 — Gate Syarat Mutlak**: Memeriksa batasan legal seleksi nasional (misal: syarat kelulusan maksimal 3 tahun terakhir untuk SNBT, kelayakan kuota akreditasi sekolah untuk SNBP). Jika gagal pada *Gate*, sistem secara tegas menolak kalkulasi peluang untuk mencegah harapan palsu.
- **Tahap 2 — Kategori Peluang Objektif**:
  - **SNBT**: Diklasifikasikan transparan menjadi `SAFE` (Aman), `MATCH` (Kompetitif/Sesuai), `REACH` (Tantangan Tinggi), atau `BELUM ADA ACUAN` berdasarkan rentang skor acuan siklus sebelumnya dan gap nilai siswa.
  - **SNBP**: Menghindari persentase kelulusan semu yang tidak berdasar. Diberikan label **Indikatif** dengan **Tingkat Keyakinan** (Rendah/Sedang) yang mempertimbangkan rekam jejak alumni dan nilai mata pelajaran penentu Kemdikbud.

### 5. Simulator Strategi Pilihan & Skenario *What-If* Real-Time
- Penyusunan portofolio 4 pilihan jurusan dengan evaluasi aturan strategi (wajib minimal 1 pilihan *Safe*, maksimal 50% *Reach*, dan peringatan konsentrasi PTN).
- Tombol **Saran Swap Otomatis** untuk merapikan urutan pilihan berdasarkan tingkat risiko.
- **Slider What-If Skor UTBK**: Memungkinkan siswa menggeser proyeksi skor UTBK (400–800) secara *real-time* untuk melihat dampaknya langsung terhadap status kelayakan tanpa memanipulasi profil asli.

### 6. Dokumen Ringkasan Strategi Siap Cetak (A4) & AI Kontekstual RAG
- **Cetak 1 Halaman A4 Instan**: Halaman ringkasan final dioptimalkan khusus dengan aturan `@media print` sehingga saat dicetak atau disimpan sebagai PDF, dokumen pas rapi dalam 1 lembar A4 tanpa potongan teks di perbatasan halaman.
- **Drawer AI Kontekstual Berbasis Sitasi Resmi (RAG)**: Panel tanya-jawab yang dapat dibuka dari tombol "Kenapa?" atau tombol melayang. Jawaban AI didasarkan pada basis pengetahuan regulasi resmi (POB SNBP/SNBT, Kepmendikbudristek No. 345/M/2024, Permendikbudristek No. 48/2022) lengkap dengan nomor bab, halaman, dan tautan sumber.

---

## 🛠️ Arsitektur & Teknologi

* **Framework UI:** React 19 + TypeScript
* **Build Tool & Bundler:** Vite (cepat, efisien, dengan *tree-shaking* optimal)
* **Styling & Desain:** Tailwind CSS (Mobile-First, Adaptive Dark/Light Mode via class `.dark`, responsive layout 100dvh)
* **Iconography:** Lucide React
* **Layer Komunikasi API (`src/services/api.ts`)**:
  - **Dual-Mode Architecture**: Mendukung peralihan instan antara **Live Backend Mode** (memanggil REST API FastAPI) dan **Smart Fallback / Offline Demo Mode** (algoritma deterministik lokal yang menjamin aplikasi 100% interaktif saat presentasi juri tanpa dependensi koneksi internet).
  - **Preset Persona 1-Klik**: Skenario Rani (Eksplorasi), Dimas (Target Spesifik), dan Kasus Gugur Gate.

---

## 💻 Panduan Menjalankan Aplikasi di Lokal

### Prasyarat
- **Node.js** v18+ atau v20+
- **npm** (atau **bun** / **yarn** / **pnpm**)

### Langkah Instalasi
```bash
# 1. Clone repositori ini
git clone https://github.com/colligetxsunib/jalurku-fe.git

# 2. Masuk ke direktori proyek
cd jalurku-fe

# 3. Salin template variabel lingkungan
cp .env.example .env

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

---

## 🤖 Transparansi Penggunaan Generative AI (Ketentuan JOINTS 2026)

Sesuai dengan ketentuan etika dan transparansi kompetisi **JOINTS UGM 2026**, tim **Colliget x Sunib** menyatakan secara terbuka penggunaan teknologi *Generative Artificial Intelligence* dalam pengembangan proyek JalurKu:

1. **AI-Assisted Interface & Layout Development**:
   - Pengembangan komponen antarmuka, tata letak visual responsif, integrasi tema Dark/Light mode, dan perapian CSS dibantu oleh model AI (**Google Gemini**, **Lovable**, dan **Antigravity AI IDE**) sebagai mitra *pair programming*.
2. **AI Engine & Algoritma NLP Sistem**:
   - Fitur **AI Story Parser** (ekstraksi minat dari narasi bebas siswa) dan **Contextual RAG Q&A Assistant** (penjelasan alasan status kelayakan berlandaskan regulasi resmi) dirancang untuk memanfaatkan **Google Gemini API** (`gemini-1.5-flash` / `gemini-2.5-flash`) yang diorkestrasikan melalui backend FastAPI `jalurku-be`.

Seluruh arsitektur sistem, aturan validasi syarat mutlak (*Gate*), rumus pembobotan deterministik, struktur basis data katalog PTN/Prodi, dan kurasi dokumen regulasi resmi disusun dan diverifikasi langsung oleh tim pengembang.

---

## 👥 Tim Pengembang (Colliget x Sunib)

Dikembangkan dengan dedikasi untuk memajukan pemerataan akses informasi pendidikan tinggi bagi seluruh calon mahasiswa Indonesia.

* **JOINTS UGM 2026 — Software Development Competition**
