import { RagCitation } from '../types';

export interface RagDocItem {
  id: string;
  topic: string;
  keywords: string[];
  answer: string;
  isOfficialVerified: boolean;
  citations: RagCitation[];
  dataDibutuhkan?: string[];
  suggestedQuestions: string[];
}

export const OFFICIAL_RAG_DATABASE: RagDocItem[] = [
  {
    id: 'rag-snbp-syarat',
    topic: 'Syarat dan Dokumen SNBP',
    keywords: ['snbp', 'dokumen', 'syarat snbp', 'eligible', 'berkas', 'rapor'],
    answer: 'Pendaftaran SNBP mensyaratkan siswa SMA/SMK/MA kelas 12 pada tahun berjalan (2026) yang masuk kuota eligible sekolah. Dokumen utama meliputi Nomor Induk Siswa Nasional (NISN), Nomor Pokok Sekolah Nasional (NPSN), nilai rapor semester 1-5 yang telah diisikan dan divalidasi di PDSS oleh pihak sekolah, serta portofolio resmi khusus untuk program studi Seni dan Olahraga.',
    isOfficialVerified: true,
    citations: [
      {
        judul: 'Panduan Operasional Baku SNBP 2026',
        dokumen: 'POB SNPMB Bagian IV - Persyaratan Sekolah dan Siswa Eligible',
        halaman: 'Hal. 14-16',
        url: 'https://snpmb.bppp.kemdikbud.go.id/panduan/pob-snbp-2026.pdf',
        kutipan: 'Siswa yang berhak mengikuti SNBP adalah siswa SMA/MA/SMK kelas terakhir (kelas 12) pada tahun 2026 yang memiliki prestasi unggul dan masuk kuota eligible sekolah sesuai akreditasi.',
      },
      {
        judul: 'Kepmendikbudristek No. 48/M/2022',
        dokumen: 'Pasal 5-7 Penerimaan Mahasiswa Baru PTN',
        halaman: 'Pasal 5 ayat (2)',
        url: 'https://peraturan.go.id/',
        kutipan: 'Seleksi nasional berdasarkan prestasi berfokus pada pemberian penghargaan tinggi atas kesuksesan pembelajaran menyeluruh di pendidikan menengah.',
      },
    ],
    suggestedQuestions: [
      'Berapa kuota siswa eligible berdasarkan akreditasi sekolah?',
      'Apakah portofolio wajib untuk semua jurusan?',
      'Bagaimana cara menghitung rata-rata nilai rapor untuk SNBP?',
    ],
  },
  {
    id: 'rag-snbt-tahun-lulus',
    topic: 'Batas Tahun Lulus UTBK-SNBT',
    keywords: ['tahun lulus', 'snbt', 'batas tahun', 'gap year', 'lulus 2022', 'lulus 2023', 'umur'],
    answer: 'Sesuai regulasi baku SNPMB, UTBK-SNBT 2026 hanya dapat diikuti oleh lulusan SMA/MA/SMK/Sederajat tahun 2024, 2025, dan 2026 (maksimal 3 tahun kelulusan terakhir). Lulusan tahun 2022 atau 2023 TIDAK DAPAT mengikuti SNBT dan otomatis gugur pada verifikasi sistem mutlak (Gate). Siswa lulusan tahun tersebut disarankan mengikuti Seleksi Mandiri PTN atau program vokasi/kedinasan yang memperbolehkan rentang kelulusan lebih panjang.',
    isOfficialVerified: true,
    citations: [
      {
        judul: 'Regulasi Resmi Pendaftaran UTBK-SNBT 2026',
        dokumen: 'POB UTBK-SNPMB Persyaratan Peserta',
        halaman: 'Hal. 8 Bab III',
        url: 'https://snpmb.bppp.kemdikbud.go.id/panduan/pob-snbt-2026.pdf',
        kutipan: 'Peserta UTBK-SNBT adalah lulusan SMA/MA/SMK/Paket C tahun 2024, 2025, dan 2026, atau peserta didik Paket C tahun 2026 dengan umur maksimal 25 tahun.',
      },
    ],
    suggestedQuestions: [
      'Apakah siswa gap year bisa memilih semua prodi di SNBT?',
      'Berapa kali kesempatan seorang siswa bisa ikut UTBK?',
      'Apa yang terjadi jika siswa lulus SNBP lalu mendaftar SNBT?',
    ],
  },
  {
    id: 'rag-reach-match-safe',
    topic: 'Metodologi Kategori Reach / Match / Safe',
    keywords: ['reach', 'match', 'safe', 'kenapa reach', 'kenapa safe', 'skor utbk', 'gap', 'kategori'],
    answer: 'Kategori kelayakan dihitung secara deterministik dengan membandingkan skor tryout UTBK Anda dengan data acuan empiris siklus sebelumnya (2026): SAFE jika skor Anda ≥ batas atas acuan (daya saing sangat aman); MATCH jika skor Anda berada di antara batas bawah dan batas atas acuan; REACH jika skor Anda berada di bawah batas bawah acuan (terdapat GAP poin yang harus dikejar); dan BELUM ADA ACUAN jika prodi baru dibuka atau data historis belum terverifikasi oleh BPPP.',
    isOfficialVerified: true,
    citations: [
      {
        judul: 'Laporan Statistik Rerata Nilai UTBK SNPMB BPPP',
        dokumen: 'Publikasi Data Daya Tampung & Keketatan Seleksi Nasional',
        halaman: 'Seksi Analisis Rerata Diterima',
        url: 'https://sidata-ptn-snpmb.bppp.kemdikbud.go.id/',
        kutipan: 'Data sebaran nilai UTBK yang dirilis BPPP merupakan distribusi skor riil peserta yang dinyatakan lulus pada siklus sebelumnya sebagai referensi pembanding empiris calon pendaftar.',
      },
    ],
    suggestedQuestions: [
      'Berapa gap skor aman untuk prodi pilihan 1?',
      'Apakah kategori Reach pasti tidak lolos?',
      'Bagaimana cara meningkatkan skor tryout UTBK secara efektif?',
    ],
  },
  {
    id: 'rag-snbp-faktor',
    topic: 'Faktor Penentu Kelulusan SNBP',
    keywords: ['faktor snbp', 'alumni', 'akreditasi', 'indeks sekolah', 'indikatif', 'presentase lolos'],
    answer: 'Sesuai regulasi resmi, peluang SNBP berstatus INDIKATIF dengan tingkat keyakinan yang bervariasi karena dipengaruhi faktor non-publik yang hanya dimiliki PTN, antara lain: (1) Rapor 50% seluruh mapel dan 50% mapel pendukung prodi, (2) Indeks prestasi alumni sekolah di PTN bersangkutan, (3) Kuota siswa eligible berdasarkan akreditasi sekolah (A: 40%, B: 25%, C: 5%), dan (4) Kebijakan persebaran wilayah daerah PTN. Kami DILARANG KERAS memberikan angka persentase kelulusan (seperti 75%) karena bersifat menyesatkan dan tidak berdasar hukum.',
    isOfficialVerified: true,
    citations: [
      {
        judul: 'Permendikbudristek No. 48 Tahun 2022',
        dokumen: 'Mekanisme Seleksi Nasional Berdasarkan Prestasi',
        halaman: 'Pasal 6-8',
        url: 'https://peraturan.bpk.go.id/Details/227546/permendikbudristek-no-48-tahun-2022',
        kutipan: 'Komponen pertama dihitung dari rata-rata nilai rapor seluruh mata pelajaran paling sedikit 50%, komponen kedua dihitung dari nilai rapor paling banyak 2 mata pelajaran pendukung, portofolio, dan/atau prestasi paling banyak 50%.',
      },
    ],
    suggestedQuestions: [
      'Kenapa JalurKu tidak menampilkan persentase peluang lulus SNBP?',
      'Apa dampak jika di sekolah saya belum ada alumni di PTN target?',
      'Bagaimana cara mengisi mata pelajaran pendukung di JalurKu?',
    ],
  },
  {
    id: 'rag-aturan-pilihan-snbt',
    topic: 'Ketentuan Memilih 4 Prodi di SNBT',
    keywords: ['aturan pilihan', '4 prodi', 'vokasi', 'sarjana', 'pilihan 1 2 3 4', 'aturan snbt'],
    answer: 'Peserta SNBT 2026 dapat memilih hingga 4 pilihan program studi dengan aturan kombinasi: Jika memilih 1 atau 2 prodi, bebas memilih program Sarjana (S1), Sarjana Terapan (D4), atau Diploma 3 (D3). Jika memilih 3 prodi, harus mengombinasikan minimal 1 program vokasi (D3/D4) dan 2 program akademik (S1), atau sebaliknya. Jika memilih 4 prodi, wajib mengombinasikan 2 program S1 dan 2 program vokasi (minimal 1 D3). Urutan pilihan menentukan prioritas seleksi oleh sistem.',
    isOfficialVerified: true,
    citations: [
      {
        judul: 'Sosialisasi Resmi SNPMB BPPP 2026',
        dokumen: 'Ketentuan Pemilihan Program Studi Jalur UTBK-SNBT',
        halaman: 'Slide 22 Paparan BPPP',
        url: 'https://snpmb.bppp.kemdikbud.go.id/',
        kutipan: 'Urutan pilihan program studi menyatakan prioritas pilihan. Ketentuan 4 pilihan prodi memfasilitasi integrasi jalur vokasi dan akademik secara optimal.',
      },
    ],
    suggestedQuestions: [
      'Apakah pilihan 1 harus selalu Safe?',
      'Apa saran komposisi ideal untuk 4 pilihan di SNBT?',
      'Bisakah memilih prodi lintas jurusan Saintek dan Soshum?',
    ],
  },
];
