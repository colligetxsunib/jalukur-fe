export type JalurType = 'SNBP' | 'SNBT';

export type AkreditasiSekolah = 'A' | 'B' | 'C' | 'Belum Terakreditasi';

export type GateStatus = 'lolos' | 'gagal' | 'data_kurang';

export type CategoryScore = 'SAFE' | 'MATCH' | 'REACH' | 'BELUM_ADA_ACUAN';

export type ConfidenceLevel = 'Rendah' | 'Sedang' | 'Tinggi';

export type NilaiTren = 'Naik' | 'Stabil' | 'Turun';

export interface RaporMapel {
  matematika: number;
  fisika?: number;
  kimia?: number;
  biologi?: number;
  ekonomi?: number;
  sosiologi?: number;
  geografi?: number;
  bahasaIndonesia: number;
  bahasaInggris: number;
}

export interface InterestScores {
  logikaKoding: number; // 1-5
  kesehatanBiologi: number; // 1-5
  bisnisManajemen: number; // 1-5
  desainKreatif: number; // 1-5
  sosialHukum: number; // 1-5
  rekayasaFisika: number; // 1-5
}

export interface StudentProfile {
  tahunLulus: number;
  provinsi: string;
  akreditasiSekolah: AkreditasiSekolah;
  skorTryout?: number; // 300 - 850
  nilaiRapor: RaporMapel;
  trenNilai: NilaiTren;
  peringkatParalel?: number;
  totalSiswaAngkatan?: number;
  interestScores: InterestScores;
  interestTags: string[];
  freeStoryText?: string;
  // School alumni history tracker for SNBP
  alumniDiterima: Record<string, boolean | undefined>; // prodi_id -> boolean
}

export interface SessionData {
  sessionId: string;
  token: string;
  consentAt: string;
  createdAt: string;
  profileCompleted: boolean;
}

export interface PTN {
  id: string;
  kode: string;
  nama: string;
  singkatan: string;
  provinsi: string;
  logoUrl?: string;
  akreditasi: 'Unggul' | 'A' | 'B';
  websiteResmi: string;
}

export interface Prodi {
  id: string;
  ptnId: string;
  nama: string;
  rumpun: 'Saintek' | 'Soshum';
  akreditasi: 'Unggul' | 'A' | 'Baik Sekali' | 'B';
  dayaTampungSNBP: number;
  dayaTampungSNBT: number;
  peminatTahunLaluSNBP: number;
  peminatTahunLaluSNBT: number;
  mapelPendukung: string[];
  acuanSkorUTBK?: {
    rendah: number;
    tinggi: number;
    tahun: number; // 2026 (siklus acuan)
    status: 'tersedia' | 'belum_ada_acuan';
  };
  sumberUrl: string;
  terakhirDiverifikasi: string;
  deskripsi: string;
  peluangKarir: string[];
  tagMinatTerkait: string[];
}

export interface ExploreRecommendation {
  prodiId: string;
  prodiNama: string;
  rumpun: 'Saintek' | 'Soshum';
  skorTotal: number; // 0 - 100
  kemiripanMinat: number; // 0 - 100
  kesesuaianNilai: number; // 0 - 100
  alasanKecocokan: string;
  peluangKarir: string[];
  ptnTersedia: {
    ptnId: string;
    ptnNama: string;
    dayaTampungSNBT: number;
    dayaTampungSNBP: number;
    akreditasiProdi: string;
  }[];
}

export interface GateCheckResult {
  lolos: boolean;
  status: GateStatus;
  syarat: {
    nama: string;
    keterangan: string;
    status: GateStatus;
    alasan?: string;
  }[];
  alasanGagal?: string;
}

export interface AssessmentResult {
  prodiId: string;
  jalur: JalurType;
  gate: GateCheckResult;
  penilaian?: {
    kategori: CategoryScore;
    skorSiswa?: number;
    acuan?: {
      rendah: number;
      tinggi: number;
      tahun: number;
      status: 'tersedia' | 'belum_ada_acuan';
    };
    gap?: number;
    posisiPersen?: number; // 0 - 100 inside range
    // Specific for SNBP
    snbpDetails?: {
      isIndikatif: true;
      tingkatKeyakinan: ConfidenceLevel;
      adaAlumni: boolean | null; // null if not answered
      faktorBelumDiketahui: string[];
      penjelasan: string;
    };
  };
  sumberUrl: string;
  terakhirDiverifikasi: string;
}

export interface StrategyChoice {
  urutan: number; // 1, 2, 3, 4
  prodiId: string;
  jalur: JalurType;
}

export interface StrategyEvaluation {
  isBalanced: boolean;
  safeCount: number;
  matchCount: number;
  reachCount: number;
  belumAdaAcuanCount: number;
  warnings: string[];
  saranSwap?: {
    prodiIdTarget: string;
    alasan: string;
    rekomendasiPenggantiProdiId: string;
    rekomendasiNama: string;
  }[];
}

export interface RagCitation {
  judul: string;
  dokumen: string;
  halaman: number | string;
  url: string;
  kutipan: string;
}

export interface AIQueryResponse {
  jawaban: string;
  yakin: boolean;
  kategoriKeyakinan: 'Terverifikasi Dokumen Resmi' | 'Informasi Terbatas / Di Luar Cakupan';
  sumber: RagCitation[];
  dataDibutuhkan: string[];
  saranPertanyaan: string[];
}

export interface DemoPersona {
  id: 'skenario_a' | 'skenario_b' | 'skenario_tepi';
  nama: string;
  tagline: string;
  deskripsi: string;
  profile: StudentProfile;
  shortlistProdiIds: string[];
  preferredStep: number;
}
