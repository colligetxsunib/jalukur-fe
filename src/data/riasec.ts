// Instrumen RIASEC lokal + skoring deterministik (fallback Smart Demo Mode).
// Mirror dari backend jalurku-be: config/app.yaml (riasec.item) & app/domain/riasec.py.
// Item diadaptasi dari O*NET Interest Profiler (U.S. DOL, domain publik).

import {
  RiasecCeritaResult,
  RiasecDimensi,
  RiasecItem,
  RiasecQuestionsResponse,
  RiasecResult,
} from '../types';

export const RIASEC_DIMENSI: RiasecDimensi[] = [
  'realistis',
  'investigatif',
  'artistik',
  'sosial',
  'enterprising',
  'konvensional',
];

// Nama dimensi -> huruf Holland (untuk membentuk kode, mis. "ICR").
const HURUF_HOLLAND: Record<RiasecDimensi, string> = {
  realistis: 'R',
  investigatif: 'I',
  artistik: 'A',
  sosial: 'S',
  enterprising: 'E',
  konvensional: 'C',
};

export const RIASEC_SKALA = {
  min: 0,
  maks: 4,
  label: {
    '0': 'Sangat tidak suka',
    '1': 'Tidak suka',
    '2': 'Netral',
    '3': 'Suka',
    '4': 'Sangat suka',
  },
} as const;

export const RIASEC_VERSI = 'riasec-id-v1';
export const RIASEC_SUMBER = 'Adaptasi O*NET Interest Profiler (U.S. DOL, domain publik)';

// 24 item (4 per dimensi) — identik dengan backend.
export const RIASEC_ITEMS: RiasecItem[] = [
  { id: 'r1', dimensi: 'realistis', teks: 'Memperbaiki alat elektronik atau mesin' },
  { id: 'r2', dimensi: 'realistis', teks: 'Merakit perabot atau barang dari petunjuk' },
  { id: 'r3', dimensi: 'realistis', teks: 'Bekerja di luar ruangan atau di lapangan' },
  { id: 'r4', dimensi: 'realistis', teks: 'Mengoperasikan peralatan atau mesin' },
  { id: 'i1', dimensi: 'investigatif', teks: 'Melakukan percobaan sains di laboratorium' },
  { id: 'i2', dimensi: 'investigatif', teks: 'Mempelajari cara kerja suatu fenomena alam' },
  { id: 'i3', dimensi: 'investigatif', teks: 'Memecahkan soal matematika atau logika yang rumit' },
  { id: 'i4', dimensi: 'investigatif', teks: 'Menganalisis data untuk menemukan pola' },
  { id: 'a1', dimensi: 'artistik', teks: 'Menggambar, melukis, atau mendesain sesuatu' },
  { id: 'a2', dimensi: 'artistik', teks: 'Menulis cerita, puisi, atau naskah' },
  { id: 'a3', dimensi: 'artistik', teks: 'Bermain musik atau menciptakan lagu' },
  { id: 'a4', dimensi: 'artistik', teks: 'Merancang tampilan visual seperti poster atau konten' },
  { id: 's1', dimensi: 'sosial', teks: 'Mengajari teman memahami pelajaran' },
  { id: 's2', dimensi: 'sosial', teks: 'Membantu orang menyelesaikan masalah pribadi' },
  { id: 's3', dimensi: 'sosial', teks: 'Menjadi relawan kegiatan sosial' },
  { id: 's4', dimensi: 'sosial', teks: 'Merawat atau mendampingi orang yang membutuhkan' },
  { id: 'e1', dimensi: 'enterprising', teks: 'Memimpin sebuah tim atau proyek' },
  { id: 'e2', dimensi: 'enterprising', teks: 'Membujuk orang untuk menyetujui ide saya' },
  { id: 'e3', dimensi: 'enterprising', teks: 'Memulai dan mengelola usaha kecil' },
  { id: 'e4', dimensi: 'enterprising', teks: 'Berbicara meyakinkan di depan banyak orang' },
  { id: 'c1', dimensi: 'konvensional', teks: 'Menyusun data atau catatan dengan rapi' },
  { id: 'c2', dimensi: 'konvensional', teks: 'Mengikuti prosedur dan aturan yang jelas' },
  { id: 'c3', dimensi: 'konvensional', teks: 'Mengelola jadwal, anggaran, atau arsip' },
  { id: 'c4', dimensi: 'konvensional', teks: 'Mengerjakan tugas yang butuh ketelitian detail' },
];

export function getRiasecQuestionsLocal(): RiasecQuestionsResponse {
  return {
    versi_instrumen: RIASEC_VERSI,
    sumber: RIASEC_SUMBER,
    skala: { min: RIASEC_SKALA.min, maks: RIASEC_SKALA.maks, label: { ...RIASEC_SKALA.label } },
    min_terjawab: 0,
    dimensi: [...RIASEC_DIMENSI],
    item: RIASEC_ITEMS,
  };
}

// (dimensi teratas, Holland code) dari vektor — tie-break alfabet, konsisten dengan backend.
function hollandDariVektor(skorNorm: Record<string, number>): {
  teratas: string[];
  holland: string;
} {
  const urut = [...RIASEC_DIMENSI].sort(
    (a, b) => (skorNorm[b] ?? 0) - (skorNorm[a] ?? 0) || a.localeCompare(b)
  );
  const teratas = urut.slice(0, 3);
  const holland = teratas.map((d) => HURUF_HOLLAND[d]).join('');
  return { teratas, holland };
}

// Skoring deterministik lokal (mirror app/domain/riasec.py:hitung).
export function scoreRiasecLocal(jawaban: Record<string, number>): RiasecResult {
  const perDimensi: Record<string, RiasecItem[]> = {};
  RIASEC_DIMENSI.forEach((d) => (perDimensi[d] = []));
  RIASEC_ITEMS.forEach((it) => perDimensi[it.dimensi].push(it));

  const skorMentah: Record<string, number> = {};
  const skorNorm: Record<string, number> = {};
  const jumlahItem: Record<string, number> = {};
  let terjawab = 0;

  for (const d of RIASEC_DIMENSI) {
    const itemD = perDimensi[d];
    jumlahItem[d] = itemD.length;
    const dijawab = itemD.filter((it) => it.id in jawaban).map((it) => jawaban[it.id]);
    terjawab += dijawab.length;
    const total = dijawab.reduce((acc, v) => acc + (v - RIASEC_SKALA.min), 0);
    skorMentah[d] = total;
    const maks = dijawab.length * (RIASEC_SKALA.maks - RIASEC_SKALA.min);
    skorNorm[d] = maks > 0 ? Number((total / maks).toFixed(4)) : 0;
  }

  const { teratas, holland } = hollandDariVektor(skorNorm);
  return {
    versi_instrumen: RIASEC_VERSI,
    skor_norm: skorNorm,
    skor_mentah: skorMentah,
    holland_code: holland,
    dimensi_teratas: teratas,
    jumlah_item: jumlahItem,
    terjawab,
    total_item: RIASEC_ITEMS.length,
    tersimpan: false,
    catatan:
      'Hasil tes minat bersifat indikatif, bukan vonis. Minat bisa berkembang; pertimbangkan bersama nilai dan kelayakan jalur.',
  };
}

// Estimasi vektor RIASEC dari cerita bebas (fallback lokal berbasis kata kunci).
// Dipakai saat demo mode / backend tak tersedia. Bukan AI; heuristik sederhana.
export function parseCeritaLocal(cerita: string): RiasecCeritaResult {
  const t = cerita.toLowerCase();
  const skor: Record<RiasecDimensi, number> = {
    realistis: 0,
    investigatif: 0,
    artistik: 0,
    sosial: 0,
    enterprising: 0,
    konvensional: 0,
  };

  const kata: Record<RiasecDimensi, string[]> = {
    realistis: ['mesin', 'alat', 'bangun', 'rakit', 'otomotif', 'lapangan', 'listrik', 'robot', 'teknik'],
    investigatif: ['koding', 'ngoding', 'program', 'data', 'analisis', 'riset', 'sains', 'logika', 'matematika', 'eksperimen', 'komputer'],
    artistik: ['desain', 'gambar', 'seni', 'musik', 'nulis', 'menulis', 'kreatif', 'ilustrasi', 'konten', 'visual'],
    sosial: ['bantu', 'ngajar', 'mengajar', 'relawan', 'rawat', 'sosial', 'peduli', 'konseling'],
    enterprising: ['bisnis', 'usaha', 'startup', 'jual', 'pimpin', 'memimpin', 'presentasi', 'negosiasi', 'wirausaha'],
    konvensional: ['atur', 'rapi', 'data', 'arsip', 'jadwal', 'anggaran', 'akuntansi', 'teliti', 'administrasi'],
  };

  (Object.keys(kata) as RiasecDimensi[]).forEach((d) => {
    const hits = kata[d].filter((k) => t.includes(k)).length;
    skor[d] = Math.min(1, Number((hits * 0.34).toFixed(4)));
  });

  const total = Object.values(skor).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return {
      skor_norm: skor,
      holland_code: '',
      dimensi_teratas: [],
      sumber: 'fallback',
      yakin: false,
      fallback: true,
      catatan:
        'Belum bisa mengenali minat dari ceritamu (mode demo). Coba tulis lebih spesifik, atau isi kuesioner.',
      tersimpan: false,
    };
  }

  const { teratas, holland } = hollandDariVektor(skor);
  return {
    skor_norm: skor,
    holland_code: holland,
    dimensi_teratas: teratas,
    sumber: 'fallback',
    yakin: true,
    fallback: true,
    catatan:
      'Perkiraan dari cerita bebas (mode demo, heuristik lokal). Untuk hasil lebih pasti, lengkapi kuesioner.',
    tersimpan: false,
  };
}
