import {
  AIQueryResponse,
  AssessmentResult,
  ExploreRecommendation,
  JalurType,
  Prodi,
  PTN,
  SessionData,
  StudentProfile,
  StrategyChoice,
  StrategyEvaluation,
} from '../types';
import { PRODI_LIST, PTN_LIST } from '../data/catalog';
import { OFFICIAL_RAG_DATABASE } from '../data/ragKnowledge';
import {
  assessTargetProdi,
  calculateRaporAverage,
  computeExploreRecommendations,
  evaluateStrategyComposition,
} from './engine';

export type ApiMode = 'demo' | 'live';

const STORAGE_KEYS = {
  API_MODE: 'jalurku_api_mode',
  BASE_URL: 'jalurku_base_url',
  SESSION_TOKEN: 'jalurku_session_token',
  SESSION_DATA: 'jalurku_session_data',
  PROFILE_DATA: 'jalurku_profile_data',
  SHORTLIST: 'jalurku_shortlist',
  STRATEGY_CHOICES: 'jalurku_strategy_choices',
};

// Default API URL from env or fallback to localhost:8000
const DEFAULT_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

class ApiService {
  private mode: ApiMode = 'demo';
  private baseUrl: string = DEFAULT_BASE_URL;
  private token: string | null = null;
  private onModeAutoSwitch?: (newMode: ApiMode, reason: string) => void;

  constructor() {
    // Load persisted settings
    const savedMode = localStorage.getItem(STORAGE_KEYS.API_MODE) as ApiMode | null;
    if (savedMode === 'live' || savedMode === 'demo') {
      this.mode = savedMode;
    }
    const savedUrl = localStorage.getItem(STORAGE_KEYS.BASE_URL);
    if (savedUrl) {
      this.baseUrl = savedUrl;
    }
    const savedToken = localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
    if (savedToken) {
      this.token = savedToken;
    }
  }

  public setModeAutoSwitchCallback(cb: (newMode: ApiMode, reason: string) => void) {
    this.onModeAutoSwitch = cb;
  }

  public getMode(): ApiMode {
    return this.mode;
  }

  public setMode(mode: ApiMode) {
    this.mode = mode;
    localStorage.setItem(STORAGE_KEYS.API_MODE, mode);
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/+$/, '');
    localStorage.setItem(STORAGE_KEYS.BASE_URL, this.baseUrl);
  }

  public getToken(): string | null {
    return this.token;
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
    }
  }

  // Helper fetch with headers and auto-fallback
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    fallbackFn: () => Promise<T> | T
  ): Promise<{ data: T; isFallback: boolean }> {
    if (this.mode === 'demo') {
      // In demo mode, execute deterministic calculation directly
      const fallbackResult = await fallbackFn();
      return { data: fallbackResult, isFallback: true };
    }

    // In live mode, attempt to call REST API
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.headers as Record<string, string>),
      };

      if (this.token && !endpoint.includes('/session') && !endpoint.includes('/health')) {
        headers['Authorization'] = `Bearer ${this.token}`;
        headers['X-Session-Token'] = this.token;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();
      return { data: json, isFallback: false };
    } catch (err: any) {
      console.warn(
        `[JalurKu API] Failed to reach live backend at ${this.baseUrl}${endpoint}. Activating Smart Fallback.`,
        err
      );
      if (this.onModeAutoSwitch) {
        this.onModeAutoSwitch(
          'demo',
          `Backend ${this.baseUrl} tidak merespons (${err?.message || 'Network Error'}). Otomatis beralih ke Smart Fallback Mode.`
        );
      }
      const fallbackResult = await fallbackFn();
      return { data: fallbackResult, isFallback: true };
    }
  }

  // 1. Session Management
  public async createSession(consent: boolean): Promise<SessionData> {
    const fallbackFn = (): SessionData => {
      const sessionId = 'sess_' + Math.random().toString(36).substring(2, 10);
      const token = 'jwt_demo_' + btoa(`${sessionId}:${Date.now()}`);
      const sessionData: SessionData = {
        sessionId,
        token,
        consentAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        profileCompleted: false,
      };
      this.setToken(token);
      localStorage.setItem(STORAGE_KEYS.SESSION_DATA, JSON.stringify(sessionData));
      return sessionData;
    };

    const res = await this.request<SessionData>(
      '/session',
      {
        method: 'POST',
        body: JSON.stringify({ consent, consent_at: new Date().toISOString() }),
      },
      fallbackFn
    );

    if (!res.isFallback && res.data.token) {
      this.setToken(res.data.token);
    }
    return res.data;
  }

  public async getSession(): Promise<SessionData | null> {
    const fallbackFn = (): SessionData | null => {
      const saved = localStorage.getItem(STORAGE_KEYS.SESSION_DATA);
      return saved ? JSON.parse(saved) : null;
    };

    const res = await this.request<SessionData | null>('/session', { method: 'GET' }, fallbackFn);
    return res.data;
  }

  public async deleteSession(): Promise<{ success: boolean }> {
    const fallbackFn = () => {
      this.setToken(null);
      localStorage.removeItem(STORAGE_KEYS.SESSION_DATA);
      localStorage.removeItem(STORAGE_KEYS.PROFILE_DATA);
      localStorage.removeItem(STORAGE_KEYS.SHORTLIST);
      localStorage.removeItem(STORAGE_KEYS.STRATEGY_CHOICES);
      return { success: true };
    };

    const res = await this.request<{ success: boolean }>(
      '/session',
      { method: 'DELETE' },
      fallbackFn
    );
    fallbackFn(); // Always clean up local storage too
    return res.data;
  }

  // 2. Profile Management
  public async getProfile(): Promise<StudentProfile | null> {
    const fallbackFn = (): StudentProfile | null => {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE_DATA);
      return saved ? JSON.parse(saved) : null;
    };

    const res = await this.request<StudentProfile | null>('/profile', { method: 'GET' }, fallbackFn);
    return res.data;
  }

  public async updateProfile(profile: StudentProfile): Promise<StudentProfile> {
    const fallbackFn = (): StudentProfile => {
      localStorage.setItem(STORAGE_KEYS.PROFILE_DATA, JSON.stringify(profile));
      return profile;
    };

    const res = await this.request<StudentProfile>(
      '/profile',
      {
        method: 'PUT',
        body: JSON.stringify(profile),
      },
      fallbackFn
    );
    return res.data;
  }

  // 3. Catalog PTN & Prodi
  public async getPTNList(): Promise<PTN[]> {
    const fallbackFn = () => PTN_LIST;
    const res = await this.request<PTN[]>('/catalog/ptn', { method: 'GET' }, fallbackFn);
    return res.data;
  }

  public async getProdiList(): Promise<Prodi[]> {
    const fallbackFn = () => PRODI_LIST;
    const res = await this.request<Prodi[]>('/catalog/prodi', { method: 'GET' }, fallbackFn);
    return res.data;
  }

  // 4. Explore Recommendations (Mode A)
  public async exploreRecommendations(profile: StudentProfile): Promise<ExploreRecommendation[]> {
    const fallbackFn = () => computeExploreRecommendations(profile);
    const res = await this.request<ExploreRecommendation[]>(
      '/explore',
      {
        method: 'POST',
        body: JSON.stringify({ profile }),
      },
      fallbackFn
    );
    return res.data;
  }

  // 5. Target Analysis (Gate + Reach/Match/Safe)
  public async analyzeTargets(
    profile: StudentProfile,
    targets: { prodiId: string; jalur: JalurType[] }[],
    overrideSkorTryout?: number
  ): Promise<AssessmentResult[]> {
    const fallbackFn = (): AssessmentResult[] => {
      const results: AssessmentResult[] = [];
      targets.forEach((target) => {
        const prodi = PRODI_LIST.find((p) => p.id === target.prodiId);
        if (!prodi) return;

        target.jalur.forEach((j) => {
          results.push(assessTargetProdi(profile, prodi, j, overrideSkorTryout));
        });
      });
      return results;
    };

    const res = await this.request<AssessmentResult[]>(
      '/analyze',
      {
        method: 'POST',
        body: JSON.stringify({
          targets: targets.map((t) => ({ prodi_id: t.prodiId, jalur: t.jalur })),
          override: overrideSkorTryout ? { skor_tryout: overrideSkorTryout } : undefined,
        }),
      },
      fallbackFn
    );
    return res.data;
  }

  // 6. Strategy & What-If Simulator
  public async evaluateStrategy(
    profile: StudentProfile,
    choices: StrategyChoice[],
    override?: { skorTryout?: number; nilaiRaporAvg?: number }
  ): Promise<StrategyEvaluation> {
    const fallbackFn = () => evaluateStrategyComposition(choices, profile, override?.skorTryout);

    const res = await this.request<StrategyEvaluation>(
      '/strategy',
      {
        method: 'POST',
        body: JSON.stringify({
          choices: choices.map((c) => ({
            urutan: c.urutan,
            prodi_id: c.prodiId,
            jalur: c.jalur,
          })),
          override: override
            ? {
                skor_tryout: override.skorTryout,
                nilai_rapor_avg: override.nilaiRaporAvg,
              }
            : undefined,
        }),
      },
      fallbackFn
    );
    return res.data;
  }

  // 7. Contextual AI RAG Query (`POST /api/v1/query`)
  public async queryAI(
    pertanyaan: string,
    konteks?: { prodiId?: string; jalur?: JalurType },
    profile?: StudentProfile | null
  ): Promise<AIQueryResponse> {
    const fallbackFn = (): AIQueryResponse => {
      const qLower = pertanyaan.toLowerCase();
      let matchedDoc = OFFICIAL_RAG_DATABASE.find((doc) =>
        doc.keywords.some((k) => qLower.includes(k.toLowerCase()))
      );

      // Context-aware logic if user asks "Kenapa prodi ini masuk kategori Reach?"
      if (konteks?.prodiId) {
        const prodi = PRODI_LIST.find((p) => p.id === konteks.prodiId);
        const ptn = prodi ? PTN_LIST.find((p) => p.id === prodi.ptnId) : null;
        const jalur = konteks.jalur || 'SNBT';

        if (qLower.includes('kenapa') || qLower.includes('alasan') || qLower.includes('kategori')) {
          if (profile && prodi) {
            const assessment = assessTargetProdi(profile, prodi, jalur);
            if (!assessment.gate.lolos) {
              return {
                jawaban: `Pada jalur ${jalur}, Anda saat ini dinyatakan TIDAK MEMENUHI SYARAT MUTLAK (Gate): ${assessment.gate.alasanGagal}. Oleh sebab itu, perhitungan kategori peluang tidak dapat dilanjutkan.`,
                yakin: true,
                kategoriKeyakinan: 'Terverifikasi Dokumen Resmi',
                sumber: [
                  {
                    judul: `Regulasi Resmi ${jalur} 2026`,
                    dokumen: `Panduan Operasional Baku BPPP Kemendikbudristek`,
                    halaman: 'Syarat Mutlak Pendaftaran Peserta',
                    url: prodi.sumberUrl,
                    kutipan: 'Calon pendaftar yang tidak memenuhi salah satu syarat mutlak dinyatakan gugur secara administratif pada tahap verifikasi sistem.',
                  },
                ],
                dataDibutuhkan: [],
                saranPertanyaan: [
                  'Apakah ada jalur lain yang menerima lulusan tahun saya?',
                  'Bagaimana cara mendaftar jalur mandiri PTN ini?',
                ],
              };
            }

            const pInfo = assessment.penilaian;
            if (jalur === 'SNBT') {
              if (pInfo?.kategori === 'SAFE') {
                return {
                  jawaban: `Prodi ${prodi.nama} di ${ptn?.singkatan || 'PTN'} masuk dalam kategori SAFE karena skor tryout Anda (${pInfo.skorSiswa}) berada di atas batas acuan tinggi (${pInfo.acuan?.tinggi}) dari siklus sebelumnya. Posisi ini memberikan jaring pengaman yang kokoh pada pilihan Anda.`,
                  yakin: true,
                  kategoriKeyakinan: 'Terverifikasi Dokumen Resmi',
                  sumber: [
                    {
                      judul: `Statistik Rerata Nilai SNBT BPPP 2026`,
                      dokumen: `Distribusi Nilai Peserta Diterima - ${prodi.nama} ${ptn?.nama}`,
                      halaman: 'Tabel Sebaran Skor Kuartil Atas',
                      url: prodi.sumberUrl,
                      kutipan: `Batas acuan aman skor UTBK tahun 2026 adalah ${pInfo.acuan?.tinggi}. Peserta dengan skor melampaui batas ini memiliki probabilitas penerimaan historis yang dominan.`,
                    },
                  ],
                  dataDibutuhkan: [],
                  saranPertanyaan: [
                    'Apakah pilihan SAFE cocok ditaruh di Pilihan 3 atau 4?',
                    'Berapa daya tampung SNBT prodi ini?',
                  ],
                };
              } else if (pInfo?.kategori === 'MATCH') {
                return {
                  jawaban: `Prodi ${prodi.nama} di ${ptn?.singkatan || 'PTN'} berada pada kategori MATCH karena skor tryout Anda (${pInfo.skorSiswa}) berada tepat di rentang acuan historis (${pInfo.acuan?.rendah} - ${pInfo.acuan?.tinggi}). Pilihan ini realistis dan sangat ideal diletakkan sebagai pilihan ke-2.`,
                  yakin: true,
                  kategoriKeyakinan: 'Terverifikasi Dokumen Resmi',
                  sumber: [
                    {
                      judul: `Statistik Rerata Nilai SNBT BPPP 2026`,
                      dokumen: `Distribusi Nilai Peserta Diterima - ${prodi.nama} ${ptn?.nama}`,
                      halaman: 'Tabel Rentang Interkuartil',
                      url: prodi.sumberUrl,
                      kutipan: `Rentang persaingan kompetitif skor UTBK berada di antara ${pInfo.acuan?.rendah} hingga ${pInfo.acuan?.tinggi}.`,
                    },
                  ],
                  dataDibutuhkan: [],
                  saranPertanyaan: [
                    'Berapa peningkatan poin yang dibutuhkan agar menjadi Safe?',
                    'Bagaimana tren peminat prodi ini tahun lalu?',
                  ],
                };
              } else if (pInfo?.kategori === 'REACH') {
                return {
                  jawaban: `Prodi ${prodi.nama} di ${ptn?.singkatan || 'PTN'} masuk dalam kategori REACH karena skor Anda (${pInfo.skorSiswa}) masih di bawah batas bawah acuan (${pInfo.acuan?.rendah}), dengan GAP sebesar ${pInfo.gap} poin. Pilihan ini adalah pilihan aspirasi (reach), disarankan didampingi oleh pilihan Safe pada urutan berikutnya.`,
                  yakin: true,
                  kategoriKeyakinan: 'Terverifikasi Dokumen Resmi',
                  sumber: [
                    {
                      judul: `Statistik Rerata Nilai SNBT BPPP 2026`,
                      dokumen: `Distribusi Nilai Peserta Diterima - ${prodi.nama} ${ptn?.nama}`,
                      halaman: 'Batas Bawah Nilai Diterima',
                      url: prodi.sumberUrl,
                      kutipan: `Batas bawah skor diterima pada siklus acuan adalah ${pInfo.acuan?.rendah}. Nilai di bawah angka ini memerlukan usaha intensif untuk menaikkan skor subtes UTBK.`,
                    },
                  ],
                  dataDibutuhkan: ['Nilai per subtes UTBK untuk memetakan kelemahan materi spesifik'],
                  saranPertanyaan: [
                    'Subtes apa yang paling berdampak menaikkan skor UTBK?',
                    'Berapa lama waktu ideal untuk menutup gap skor?',
                  ],
                };
              }
            } else {
              // SNBP Context
              return {
                jawaban: `Analisis prodi ${prodi.nama} di ${ptn?.singkatan || 'PTN'} untuk jalur SNBP bersifat INDIKATIF dengan tingkat keyakinan ${pInfo?.snbpDetails?.tingkatKeyakinan}. ${pInfo?.snbpDetails?.penjelasan}`,
                yakin: true,
                kategoriKeyakinan: 'Terverifikasi Dokumen Resmi',
                sumber: [
                  {
                    judul: 'Permendikbudristek No. 48 Tahun 2022',
                    dokumen: 'Mekanisme Seleksi Nasional Berdasarkan Prestasi',
                    halaman: 'Pasal 6-8',
                    url: prodi.sumberUrl,
                    kutipan: 'Komponen pertama dihitung dari rata-rata nilai rapor seluruh mata pelajaran paling sedikit 50%, komponen kedua dihitung dari nilai rapor mata pelajaran pendukung.',
                  },
                ],
                dataDibutuhkan: pInfo?.snbpDetails?.adaAlumni === null ? ['Konfirmasi ketersediaan alumni sekolah di prodi ini'] : [],
                saranPertanyaan: [
                  'Kenapa jalur SNBP tidak memberikan persentase angka pasti?',
                  'Apakah sertifikat lomba dapat menaikkan peluang SNBP?',
                ],
              };
            }
          }
        }
      }

      // If matched from database
      if (matchedDoc) {
        return {
          jawaban: matchedDoc.answer,
          yakin: matchedDoc.isOfficialVerified,
          kategoriKeyakinan: matchedDoc.isOfficialVerified
            ? 'Terverifikasi Dokumen Resmi'
            : 'Informasi Terbatas / Di Luar Cakupan',
          sumber: matchedDoc.citations,
          dataDibutuhkan: matchedDoc.dataDibutuhkan || [],
          saranPertanyaan: matchedDoc.suggestedQuestions,
        };
      }

      // Check if user is asking about unverified / out-of-scope topics (e.g. Mandiri, passing grade hoaxes, calo)
      const isOutOfScope =
        qLower.includes('mandiri') ||
        qLower.includes('bocoran') ||
        qLower.includes('orang dalam') ||
        qLower.includes('uang pangkal') ||
        qLower.includes('biaya kuliah') ||
        qLower.includes('passing grade');

      if (isOutOfScope) {
        return {
          jawaban:
            'Pertanyaan Anda berkaitan dengan informasi di luar cakupan regulasi resmi SNBP & SNBT (seperti Jalur Seleksi Mandiri perguruan tinggi, besaran Uang Kuliah Tunggal (UKT), atau rumor persentase kelulusan tidak resmi). Dokumen acuan BPPP kami tidak memuat data tersebut demi mencegah disinformasi. Kami sarankan Anda langsung mengonfirmasi ke portal resmi penerimaan universitas terkait atau berkonsultasi dengan Guru BK sekolah.',
          yakin: false,
          kategoriKeyakinan: 'Informasi Terbatas / Di Luar Cakupan',
          sumber: [],
          dataDibutuhkan: [],
          saranPertanyaan: [
            'Berapa batas tahun kelulusan untuk SNBT?',
            'Apa saja syarat dokumen eligible SNBP?',
            'Bagaimana cara menghitung GAP skor pada pilihan prodi?',
          ],
        };
      }

      // General verified response
      return {
        jawaban:
          'Sistem JalurKu menggunakan basis data resmi BPPP Kemendikbudristek dan regulasi SNPMB terkini. Seluruh penilaian kelayakan dihitung menggunakan formula deterministik acuan empiris tanpa tebak-tebakan probabilitas semu.',
        yakin: true,
        kategoriKeyakinan: 'Terverifikasi Dokumen Resmi',
        sumber: [
          {
            judul: 'Portal Resmi SNPMB BPPP Kemendikbudristek',
            dokumen: 'Pusat Informasi & Regulasi Seleksi Nasional 2026',
            halaman: 'Beranda Informasi Resmi',
            url: 'https://snpmb.bppp.kemdikbud.go.id/',
            kutipan: 'SNPMB adalah seleksi nasional penerimaan mahasiswa baru yang diselenggarakan secara transparan, akuntabel, dan terstandar nasional.',
          },
        ],
        dataDibutuhkan: [],
        saranPertanyaan: [
          'Apa saja syarat kelulusan SNBP?',
          'Berapa batas tahun lulus SNBT?',
          'Bagaimana aturan memilih 4 prodi di SNBT?',
        ],
      };
    };

    const res = await this.request<AIQueryResponse>(
      '/query',
      {
        method: 'POST',
        body: JSON.stringify({
          pertanyaan,
          konteks,
        }),
      },
      fallbackFn
    );
    return res.data;
  }

  // 8. Health check for live backend
  public async checkHealth(): Promise<{ ok: boolean; status: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return { ok: res.ok, status: res.statusText };
    } catch {
      return { ok: false, status: 'Offline / Unreachable' };
    }
  }
}

export const apiService = new ApiService();
