import {
  AIQueryResponse,
  AssessmentResult,
  ExploreRecommendation,
  JalurType,
  Prodi,
  PTN,
  RiasecCeritaResult,
  RiasecQuestionsResponse,
  RiasecResult,
  SessionData,
  StudentProfile,
  StrategyChoice,
  StrategyEvaluation,
} from "../types";
import { PRODI_LIST, PTN_LIST } from "../data/catalog";
import { OFFICIAL_RAG_DATABASE } from "../data/ragKnowledge";
import {
  getRiasecQuestionsLocal,
  parseCeritaLocal,
  scoreRiasecLocal,
} from "../data/riasec";
import {
  assessTargetProdi,
  calculateRaporAverage,
  computeExploreRecommendations,
  evaluateStrategyComposition,
} from "./engine";

export type ApiMode = "demo" | "live";

const STORAGE_KEYS = {
  SESSION_TOKEN: "jalurku_session_token",
  SESSION_DATA: "jalurku_session_data",
  PROFILE_DATA: "jalurku_profile_data",
  SHORTLIST: "jalurku_shortlist",
  STRATEGY_CHOICES: "jalurku_strategy_choices",
};

// ---------------------------------------------------------------------------------------------
// Konfigurasi koneksi HANYA dari environment (.env), tidak lagi dari UI/localStorage.
//   VITE_API_BASE_URL : base URL backend (wajib ada prefix /api/v1).
//   VITE_API_MODE     : "live" | "demo" (opsional). Bila tidak diisi, ikut mode build:
//                       build produksi → live, dev → demo.
// Trailing slash dibersihkan agar penggabungan endpoint konsisten.
// ---------------------------------------------------------------------------------------------
const BASE_URL: string = (
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000/api/v1"
).replace(/\/+$/, "");

const ENV_MODE = (import.meta as any).env?.VITE_API_MODE as string | undefined;
const API_MODE: ApiMode =
  ENV_MODE === "live" || ENV_MODE === "demo"
    ? ENV_MODE
    : import.meta.env.PROD
      ? "live"
      : "demo";

// Pemetaan akreditasi FE → nilai baku backend ProfilePatch.akreditasi_sekolah.
const AKREDITASI_KE_BACKEND: Record<
  string,
  "A" | "B" | "C" | "tidak_terakreditasi"
> = {
  A: "A",
  B: "B",
  C: "C",
  "Belum Terakreditasi": "tidak_terakreditasi",
};

// Pemetaan RaporMapel (FE, camelCase) → nama mapel baku backend (snake_case).
// Nama mapel FINAL dari config/app.yaml (explore.rumpun.*.mapel) — lihat INTEGRATION_CONTRACT.md
// Keputusan 1. Hanya dua mapel yang berbeda ejaan; sisanya sudah snake_case.
const MAPEL_KE_BACKEND: Record<string, string> = {
  matematika: "matematika",
  fisika: "fisika",
  kimia: "kimia",
  biologi: "biologi",
  ekonomi: "ekonomi",
  sosiologi: "sosiologi",
  geografi: "geografi",
  bahasaIndonesia: "bahasa_indonesia",
  bahasaInggris: "bahasa_inggris",
};

/**
 * Bangun nilai_rapor backend dari RaporMapel flat FE.
 * Keputusan 1 (INTEGRATION_CONTRACT.md): backend memakai semester_1..5; FE menyimpan rapor flat
 * tanpa dimensi semester. Untuk menghindari memalsukan "tren nilai" (yang dibaca mesin aturan)
 * dengan menduplikasi angka identik ke 5 semester, nilai flat diisi ke `semester_5` saja —
 * semester terakhir yang dipakai backend. Dibungkus agar mudah diganti bila UI kelak mendukung
 * input per-semester.
 */
function toNilaiRaporPatch(
  rapor: StudentProfile["nilaiRapor"],
): Record<string, Record<string, number>> | undefined {
  if (!rapor) return undefined;
  const mapel: Record<string, number> = {};
  for (const [feKey, beKey] of Object.entries(MAPEL_KE_BACKEND)) {
    const nilai = (rapor as unknown as Record<string, number | undefined>)[
      feKey
    ];
    if (typeof nilai === "number" && !Number.isNaN(nilai)) {
      mapel[beKey] = nilai;
    }
  }
  if (Object.keys(mapel).length === 0) return undefined;
  return { semester_5: mapel };
}

/**
 * Adapter StudentProfile (FE, camelCase) → ProfilePatch (backend, snake_case).
 * Backend memvalidasi dengan extra="forbid", jadi HANYA kirim key yang dikenal ProfilePatch.
 * Field yang tidak ada padanannya di ProfilePatch (trenNilai, interestTags, freeStoryText,
 * alumniDiterima) sengaja TIDAK dikirim agar tidak memicu 422.
 *
 * Keputusan 4 (INTEGRATION_CONTRACT.md): `interestScores` (skala 1-5, sumbu non-RIASEC) TIDAK
 * dipetakan ke `minat`. Sumber `minat` backend adalah alur RIASEC (/riasec/submit simpan=true),
 * yang sudah sinkron; mengirim interestScores akan salah skala & salah dimensi.
 */
function toProfilePatch(profile: StudentProfile): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  if (profile.tahunLulus !== undefined) patch.tahun_lulus = profile.tahunLulus;
  if (profile.provinsi !== undefined) patch.provinsi = profile.provinsi;
  if (profile.akreditasiSekolah !== undefined) {
    patch.akreditasi_sekolah = AKREDITASI_KE_BACKEND[profile.akreditasiSekolah];
  }
  if (profile.skorTryout !== undefined) patch.skor_tryout = profile.skorTryout;
  if (profile.peringkatParalel !== undefined) {
    patch.peringkat_sekolah = profile.peringkatParalel;
  }
  if (profile.totalSiswaAngkatan !== undefined) {
    patch.jumlah_siswa_angkatan = profile.totalSiswaAngkatan;
  }
  const nilaiRapor = toNilaiRaporPatch(profile.nilaiRapor);
  if (nilaiRapor !== undefined) patch.nilai_rapor = nilaiRapor;

  return patch;
}

class ApiService {
  // Mode & baseUrl dikunci dari environment (.env) saat konstruksi — tidak bisa diubah runtime.
  // Di mode live, bila backend tak terjangkau, request() tetap auto-fallback ke demo per-panggilan
  // (lihat onModeAutoSwitch) tanpa mengubah konfigurasi global.
  private mode: ApiMode = API_MODE;
  private baseUrl: string = BASE_URL;
  private token: string | null = null;
  private onModeAutoSwitch?: (newMode: ApiMode, reason: string) => void;

  constructor() {
    const savedToken = localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
    if (savedToken) {
      this.token = savedToken;
    }
  }

  public setModeAutoSwitchCallback(
    cb: (newMode: ApiMode, reason: string) => void,
  ) {
    this.onModeAutoSwitch = cb;
  }

  public getMode(): ApiMode {
    return this.mode;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
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
    fallbackFn: () => Promise<T> | T,
  ): Promise<{ data: T; isFallback: boolean }> {
    if (this.mode === "demo") {
      // In demo mode, execute deterministic calculation directly
      const fallbackResult = await fallbackFn();
      return { data: fallbackResult, isFallback: true };
    }

    // In live mode, attempt to call REST API
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options.headers as Record<string, string>),
      };

      // Hanya POST /session (pembuatan sesi) & /health yang boleh tanpa token.
      // GET/DELETE /session butuh token (backend status_sesi/hapus pakai sesi_saat_ini).
      const isSessionCreate =
        endpoint === "/session" && (options.method ?? "GET") === "POST";
      if (this.token && !isSessionCreate && !endpoint.includes("/health")) {
        headers["Authorization"] = `Bearer ${this.token}`;
        headers["X-Session-Token"] = this.token;
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
        // Baca envelope error standar backend: { error: { kode, pesan, detail } }.
        let payload: any = null;
        try {
          payload = await response.json();
        } catch {
          // body bukan JSON (mis. 204/502 HTML) — biarkan payload null
        }
        const be = payload?.error;
        const err: any = new Error(
          be?.pesan || `HTTP Error: ${response.status} ${response.statusText}`,
        );
        err.status = response.status;
        err.kode = be?.kode;
        err.detail = be?.detail;
        err.isClientError = response.status >= 400 && response.status < 500;
        err.isServerError = response.status >= 500;
        throw err;
      }

      const json = await response.json();
      return { data: json, isFallback: false };
    } catch (err: any) {
      // Error 4xx dari backend = masalah permintaan (payload/token), BUKAN backend mati.
      // Jangan sembunyikan di balik Smart Fallback — lempar agar UI menampilkan pesan backend.
      if (err?.isClientError) {
        if (err.status === 401) {
          // Sesi mati/invalid: bersihkan token agar alur memaksa pembuatan sesi ulang.
          this.setToken(null);
        }
        throw err;
      }

      // Network error (fetch gagal total → TypeError) atau timeout (AbortError) atau 5xx:
      // backend memang tidak bisa diandalkan → aktifkan Smart Fallback.
      const isTimeout = err?.name === "AbortError";
      const isNetwork = isTimeout || err instanceof TypeError;
      const is5xx = err?.isServerError === true;

      if (isNetwork || is5xx) {
        console.warn(
          `[JalurKu API] Failed to reach live backend at ${this.baseUrl}${endpoint}. Activating Smart Fallback.`,
          err,
        );
        if (this.onModeAutoSwitch) {
          this.onModeAutoSwitch(
            "demo",
            `Backend ${this.baseUrl} tidak merespons (${err?.message || "Network Error"}). Otomatis beralih ke Smart Fallback Mode.`,
          );
        }
        const fallbackResult = await fallbackFn();
        return { data: fallbackResult, isFallback: true };
      }

      // Kelas error lain yang tak terduga: lempar, jangan telan diam-diam.
      throw err;
    }
  }

  // 1. Session Management
  public async createSession(consent: boolean): Promise<SessionData> {
    const fallbackFn = (): SessionData => {
      const sessionId = "sess_" + Math.random().toString(36).substring(2, 10);
      const token = "jwt_demo_" + btoa(`${sessionId}:${Date.now()}`);
      const sessionData: SessionData = {
        sessionId,
        token,
        consentAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        profileCompleted: false,
      };
      this.setToken(token);
      localStorage.setItem(
        STORAGE_KEYS.SESSION_DATA,
        JSON.stringify(sessionData),
      );
      return sessionData;
    };

    const res = await this.request<any>(
      "/session",
      {
        method: "POST",
        // Backend SessionCreate (extra="forbid"): wajib `consent` + `consent_version` non-empty.
        // Field `consent_at` tidak dikenal backend → 422. Jangan dikirim.
        // Versi consent dikonfigurasi via env (.env), fallback "v1.0".
        body: JSON.stringify({
          consent,
          consent_version:
            (import.meta as any).env?.VITE_CONSENT_VERSION || "v1.0",
        }),
      },
      fallbackFn,
    );

    // Jalur demo: fallbackFn sudah mengembalikan SessionData lengkap.
    if (res.isFallback) {
      return res.data as SessionData;
    }

    // Jalur live: backend mengembalikan SessionCreated = { token, expires_at, sisa_detik, pemberitahuan }.
    // Normalisasi eksplisit ke SessionData agar tidak ada field undefined yang bocor ke konsumen.
    const raw = res.data ?? {};
    const mapped: SessionData = {
      sessionId: raw.sessionId ?? "",
      token: raw.token ?? "",
      consentAt: raw.consent_at ?? new Date().toISOString(),
      createdAt: raw.created_at ?? new Date().toISOString(),
      profileCompleted: Boolean(raw.profileCompleted),
    };
    if (mapped.token) {
      this.setToken(mapped.token);
    }
    return mapped;
  }

  public async getSession(): Promise<SessionData | null> {
    const fallbackFn = (): SessionData | null => {
      const saved = localStorage.getItem(STORAGE_KEYS.SESSION_DATA);
      return saved ? JSON.parse(saved) : null;
    };

    const res = await this.request<SessionData | null>(
      "/session",
      { method: "GET" },
      fallbackFn,
    );
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
      "/session",
      { method: "DELETE" },
      fallbackFn,
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

    const res = await this.request<any>(
      "/profile",
      { method: "GET" },
      fallbackFn,
    );
    if (res.isFallback) {
      return res.data as StudentProfile | null;
    }
    // Backend /profile → ProfilResponse = { profil, data_kurang, pertanyaan } (Task 0),
    // BUKAN StudentProfile. Pemetaan balik profil backend → StudentProfile belum disepakati
    // (termasuk nilai_rapor berstruktur). TODO (Task 9): map res.data.profil → StudentProfile.
    // Sementara: kembalikan cache lokal agar UI tidak menerima bentuk yang salah.
    return fallbackFn();
  }

  public async updateProfile(profile: StudentProfile): Promise<StudentProfile> {
    const fallbackFn = (): StudentProfile => {
      localStorage.setItem(STORAGE_KEYS.PROFILE_DATA, JSON.stringify(profile));
      return profile;
    };

    const res = await this.request<any>(
      "/profile",
      {
        method: "PUT",
        // Backend PUT /profile memvalidasi ProfilePatch (snake_case). Kirim hasil adapter,
        // JANGAN kirim StudentProfile mentah (seluruh key camelCase → 422).
        body: JSON.stringify(toProfilePatch(profile)),
      },
      fallbackFn,
    );
    if (res.isFallback) {
      return res.data as StudentProfile;
    }
    // Response adalah ProfilResponse, bukan StudentProfile. Simpan ke cache lokal dan kembalikan
    // profil FE asli agar konsumen tetap menerima StudentProfile yang valid.
    // TODO (Task 9): bila pemetaan balik disepakati, map res.data.profil → StudentProfile.
    localStorage.setItem(STORAGE_KEYS.PROFILE_DATA, JSON.stringify(profile));
    return profile;
  }

  // 3. Catalog PTN & Prodi
  public async getPTNList(): Promise<PTN[]> {
    const fallbackFn = () => PTN_LIST;
    const res = await this.request<any>(
      "/catalog/ptn",
      { method: "GET" },
      fallbackFn,
    );
    if (res.isFallback) {
      return res.data as PTN[];
    }
    // Backend /catalog/ptn berpaginasi: { items, total, page, limit, total_halaman } (Task 0).
    // Unwrap `items` agar konsumen selalu menerima array.
    // Catatan: bentuk item backend lebih ramping dari PTN (butuh adapter — Task 9).
    return (res.data?.items ?? res.data ?? []) as PTN[];
  }

  public async getProdiList(): Promise<Prodi[]> {
    const fallbackFn = () => PRODI_LIST;
    const res = await this.request<any>(
      "/catalog/prodi",
      { method: "GET" },
      fallbackFn,
    );
    if (res.isFallback) {
      return res.data as Prodi[];
    }
    // Backend /catalog/prodi berpaginasi: { items, total, page, limit, total_halaman } (Task 0).
    // Unwrap `items` agar konsumen selalu menerima array.
    // Catatan: bentuk item backend berbeda dari Prodi (butuh adapter — Task 9).
    return (res.data?.items ?? res.data ?? []) as Prodi[];
  }

  // 4. Explore Recommendations (Mode A)
  public async exploreRecommendations(
    profile: StudentProfile,
  ): Promise<ExploreRecommendation[]> {
    const fallbackFn = () => computeExploreRecommendations(profile);
    const res = await this.request<any>(
      "/explore",
      {
        method: "POST",
        // Backend ExploreRequest (extra="forbid") hanya menerima { top_n?, jalur? }.
        // Profil dibaca backend dari sesi, BUKAN dari body → kirim {} agar tidak 422.
        body: JSON.stringify({}),
      },
      fallbackFn,
    );

    // Jalur demo: fallbackFn sudah mengembalikan ExploreRecommendation[].
    if (res.isFallback) {
      return res.data as ExploreRecommendation[];
    }

    // Jalur live: backend membungkus hasil dalam { rekomendasi: [...], ... } (Task 0).
    // Unwrap defensif agar konsumen selalu menerima array dan prodiNama tidak pernah undefined.
    const rawItems = (res.data?.rekomendasi ?? res.data ?? []) as any[];
    return rawItems.map((item: any, idx: number) => {
      const prodiNama = String(
        item?.prodiNama || item?.nama_prodi || item?.prodi_nama || item?.nama || item?.rumpun || ''
      );
      const prodiId = String(
        item?.prodiId || item?.prodi_id || (Array.isArray(item?.prodi_ids) && item.prodi_ids[0]) || `rec_${idx}`
      );
      return {
        prodiId,
        prodiNama,
        rumpun: (item?.rumpun as any) || 'Saintek',
        skorTotal: Number(item?.skorTotal ?? Math.round((item?.skor_kecocokan ?? 0) * 100)),
        kemiripanMinat: Number(item?.kemiripanMinat ?? Math.round((item?.komponen?.minat ?? 0) * 100)),
        kesesuaianNilai: Number(item?.kesesuaianNilai ?? Math.round((item?.komponen?.nilai ?? 0) * 100)),
        alasanKecocokan: String(item?.alasanKecocokan || item?.alasan || ''),
        peluangKarir: Array.isArray(item?.peluangKarir)
          ? item.peluangKarir
          : (Array.isArray(item?.contoh_profesi) ? item.contoh_profesi : []),
        ptnTersedia: Array.isArray(item?.ptnTersedia)
          ? item.ptnTersedia
          : (Array.isArray(item?.ptn) ? item.ptn.map((p: any) => ({
              ptnId: String(p?.id || p?.ptn_id || ''),
              ptnNama: String(p?.nama || p?.ptn_nama || ''),
              dayaTampungSNBT: Number(p?.dayaTampungSNBT ?? p?.daya_tampung_snbt ?? 0),
              dayaTampungSNBP: Number(p?.dayaTampungSNBP ?? p?.daya_tampung_snbp ?? 0),
              akreditasiProdi: String(p?.akreditasiProdi || p?.akreditasi || 'A'),
            })) : []),
      };
    });
  }

  // 4b. Tes Minat RIASEC — instrumen (GET /riasec/questions)
  public async getRiasecQuestions(): Promise<RiasecQuestionsResponse> {
    const fallbackFn = () => getRiasecQuestionsLocal();
    const res = await this.request<RiasecQuestionsResponse>(
      "/riasec/questions",
      { method: "GET" },
      fallbackFn,
    );
    return res.data;
  }

  // 4c. Tes Minat RIASEC — kirim jawaban kuesioner (POST /riasec/submit)
  public async submitRiasec(
    jawaban: Record<string, number>,
    simpan = true,
  ): Promise<RiasecResult> {
    const fallbackFn = (): RiasecResult => ({
      ...scoreRiasecLocal(jawaban),
      tersimpan: simpan,
    });
    const res = await this.request<RiasecResult>(
      "/riasec/submit",
      { method: "POST", body: JSON.stringify({ jawaban, simpan }) },
      fallbackFn,
    );
    return res.data;
  }

  // 4d. Tes Minat RIASEC — cerita bebas via AI (POST /riasec/cerita, degradasi mulus)
  public async parseRiasecCerita(
    cerita: string,
    simpan = true,
  ): Promise<RiasecCeritaResult> {
    // Keputusan 3 (INTEGRATION_CONTRACT.md): endpoint /riasec/cerita TIDAK ADA di backend
    // (router hanya questions & submit). Memanggilnya live pasti 404 → DEMO-ONLY: selalu
    // pakai parser lokal, tidak memanggil backend. Cabut flag ini bila backend menambah endpoint.
    const fallbackFn = (): RiasecCeritaResult => ({
      ...parseCeritaLocal(cerita),
      tersimpan: simpan,
    });
    return fallbackFn();
  }

  // 5. Target Analysis (Gate + Reach/Match/Safe)
  public async analyzeTargets(
    profile: StudentProfile,
    targets: { prodiId: string; jalur: JalurType[] }[],
    overrideSkorTryout?: number,
  ): Promise<AssessmentResult[]> {
    const fallbackFn = (): AssessmentResult[] => {
      const results: AssessmentResult[] = [];
      targets.forEach((target) => {
        const prodi = PRODI_LIST.find((p) => p.id === target.prodiId);
        if (!prodi) return;

        target.jalur.forEach((j) => {
          results.push(
            assessTargetProdi(profile, prodi, j, overrideSkorTryout),
          );
        });
      });
      return results;
    };

    const res = await this.request<any>(
      "/analyze",
      {
        method: "POST",
        body: JSON.stringify({
          targets: targets.map((t) => ({
            prodi_id: t.prodiId,
            jalur: t.jalur,
          })),
          // `skor_tryout` valid di ProfilePatch. Jangan tambah field lain (extra="forbid").
          override: overrideSkorTryout
            ? { skor_tryout: overrideSkorTryout }
            : undefined,
        }),
      },
      fallbackFn,
    );

    // Jalur demo: fallbackFn sudah mengembalikan AssessmentResult[].
    if (res.isFallback) {
      return res.data as AssessmentResult[];
    }

    // Jalur live: backend membungkus { hasil: [...] } (Task 0). Unwrap agar konsumen
    // selalu menerima array (res.data langsung = objek → .map/.forEach crash).
    // Catatan: bentuk item backend berbeda dari AssessmentResult (butuh adapter — Task 9).
    return (res.data?.hasil ?? []) as AssessmentResult[];
  }

  // 6. Strategy & What-If Simulator
  public async evaluateStrategy(
    profile: StudentProfile,
    choices: StrategyChoice[],
    override?: { skorTryout?: number; nilaiRaporAvg?: number },
  ): Promise<StrategyEvaluation> {
    const fallbackFn = () =>
      evaluateStrategyComposition(choices, profile, override?.skorTryout);

    // Backend mengevaluasi SATU jalur. Turunkan `jalur` dari pilihan (asumsi homogen).
    // CATATAN (Task 9): bila UI mengizinkan mencampur SNBP & SNBT dalam satu `choices`,
    // ini keliru — backend butuh satu jalur per permintaan. Perlu keputusan apakah FE
    // memisah per jalur sebelum memanggil. Saat ini diasumsikan homogen.
    const jalur = choices[0]?.jalur ?? "SNBT";

    const res = await this.request<any>(
      "/strategy",
      {
        method: "POST",
        // Backend StrategyRequest (extra="forbid"): `jalur` wajib top-level;
        // `pilihan` HANYA { prodi_id } (urutan/jalur per item dilarang → 422).
        // `nilai_rapor_avg` BUKAN field ProfilePatch → jangan dikirim.
        body: JSON.stringify({
          jalur,
          pilihan: choices.map((c) => ({ prodi_id: c.prodiId })),
          ...(override?.skorTryout !== undefined
            ? { override: { skor_tryout: override.skorTryout } }
            : {}),
        }),
      },
      fallbackFn,
    );

    // Jalur demo: fallbackFn sudah mengembalikan StrategyEvaluation.
    if (res.isFallback) {
      return res.data as StrategyEvaluation;
    }

    // Jalur live: backend mengembalikan { jalur, batas_pilihan, hasil, komposisi, temuan,
    // disimpan, strategy_id, catatan } (Task 0). Normalisasi ke StrategyEvaluation.
    const raw = res.data ?? {};
    const komposisi = raw.komposisi ?? {};
    const temuan: any[] = Array.isArray(raw.temuan) ? raw.temuan : [];

    // belum_ada_acuan tidak masuk `komposisi`; dihitung dari temuan berkode khusus.
    const belumAdaAcuanTemuan = temuan.find(
      (t) => t?.kode === "pilihan_belum_ada_acuan",
    );
    const belumAdaAcuanCount = Array.isArray(belumAdaAcuanTemuan?.prodi_ids)
      ? belumAdaAcuanTemuan.prodi_ids.length
      : 0;

    const safeCount = Number(komposisi.safe ?? 0);
    const matchCount = Number(komposisi.match ?? 0);
    const reachCount = Number(komposisi.reach ?? 0);

    // "Seimbang" bila tidak ada temuan tingkat pelanggaran/peringatan.
    const isBalanced = !temuan.some(
      (t) => t?.tingkat === "pelanggaran" || t?.tingkat === "peringatan",
    );

    // warnings: pesan dari temuan pelanggaran + peringatan (info bersifat netral).
    const warnings = temuan
      .filter(
        (t) => t?.tingkat === "pelanggaran" || t?.tingkat === "peringatan",
      )
      .map((t) => String(t?.pesan ?? ""))
      .filter((p) => p.length > 0);

    // saranSwap: ratakan saran_swap dari seluruh temuan. Backend saran = { ganti, dengan, alasan };
    // nama prodi pengganti tidak dipisah (ada di dalam teks `alasan`), jadi rekomendasiNama kosong.
    const saranSwap = temuan.flatMap((t) =>
      (Array.isArray(t?.saran_swap) ? t.saran_swap : []).map((s: any) => ({
        prodiIdTarget: String(s?.ganti ?? ""),
        alasan: String(s?.alasan ?? ""),
        rekomendasiPenggantiProdiId: String(s?.dengan ?? ""),
        rekomendasiNama: "",
      })),
    );

    const mapped: StrategyEvaluation = {
      isBalanced,
      safeCount,
      matchCount,
      reachCount,
      belumAdaAcuanCount,
      warnings,
      saranSwap,
    };
    return mapped;
  }

  // 7. Contextual AI RAG Query (`POST /api/v1/query`)
  public async queryAI(
    pertanyaan: string,
    konteks?: { prodiId?: string; jalur?: JalurType },
    profile?: StudentProfile | null,
  ): Promise<AIQueryResponse> {
    const fallbackFn = (): AIQueryResponse => {
      const qLower = pertanyaan.toLowerCase();
      let matchedDoc = OFFICIAL_RAG_DATABASE.find((doc) =>
        doc.keywords.some((k) => qLower.includes(k.toLowerCase())),
      );

      // Context-aware logic if user asks "Kenapa prodi ini masuk kategori Reach?"
      if (konteks?.prodiId) {
        const prodi = PRODI_LIST.find((p) => p.id === konteks.prodiId);
        const ptn = prodi ? PTN_LIST.find((p) => p.id === prodi.ptnId) : null;
        const jalur = konteks.jalur || "SNBT";

        if (
          qLower.includes("kenapa") ||
          qLower.includes("alasan") ||
          qLower.includes("kategori")
        ) {
          if (profile && prodi) {
            const assessment = assessTargetProdi(profile, prodi, jalur);
            if (!assessment.gate.lolos) {
              return {
                jawaban: `Pada jalur ${jalur}, Anda saat ini dinyatakan TIDAK MEMENUHI SYARAT MUTLAK (Gate): ${assessment.gate.alasanGagal}. Oleh sebab itu, perhitungan kategori peluang tidak dapat dilanjutkan.`,
                yakin: true,
                kategoriKeyakinan: "Terverifikasi Dokumen Resmi",
                sumber: [
                  {
                    judul: `Regulasi Resmi ${jalur} 2026`,
                    dokumen: `Panduan Operasional Baku BPPP Kemendikbudristek`,
                    halaman: "Syarat Mutlak Pendaftaran Peserta",
                    url: prodi.sumberUrl,
                    kutipan:
                      "Calon pendaftar yang tidak memenuhi salah satu syarat mutlak dinyatakan gugur secara administratif pada tahap verifikasi sistem.",
                  },
                ],
                dataDibutuhkan: [],
                saranPertanyaan: [
                  "Apakah ada jalur lain yang menerima lulusan tahun saya?",
                  "Bagaimana cara mendaftar jalur mandiri PTN ini?",
                ],
              };
            }

            const pInfo = assessment.penilaian;
            if (jalur === "SNBT") {
              if (pInfo?.kategori === "SAFE") {
                return {
                  jawaban: `Prodi ${prodi.nama} di ${ptn?.singkatan || "PTN"} masuk dalam kategori SAFE karena skor tryout Anda (${pInfo.skorSiswa}) berada di atas batas acuan tinggi (${pInfo.acuan?.tinggi}) dari siklus sebelumnya. Posisi ini memberikan jaring pengaman yang kokoh pada pilihan Anda.`,
                  yakin: true,
                  kategoriKeyakinan: "Terverifikasi Dokumen Resmi",
                  sumber: [
                    {
                      judul: `Statistik Rerata Nilai SNBT BPPP 2026`,
                      dokumen: `Distribusi Nilai Peserta Diterima - ${prodi.nama} ${ptn?.nama}`,
                      halaman: "Tabel Sebaran Skor Kuartil Atas",
                      url: prodi.sumberUrl,
                      kutipan: `Batas acuan aman skor UTBK tahun 2026 adalah ${pInfo.acuan?.tinggi}. Peserta dengan skor melampaui batas ini memiliki probabilitas penerimaan historis yang dominan.`,
                    },
                  ],
                  dataDibutuhkan: [],
                  saranPertanyaan: [
                    "Apakah pilihan SAFE cocok ditaruh di Pilihan 3 atau 4?",
                    "Berapa daya tampung SNBT prodi ini?",
                  ],
                };
              } else if (pInfo?.kategori === "MATCH") {
                return {
                  jawaban: `Prodi ${prodi.nama} di ${ptn?.singkatan || "PTN"} berada pada kategori MATCH karena skor tryout Anda (${pInfo.skorSiswa}) berada tepat di rentang acuan historis (${pInfo.acuan?.rendah} - ${pInfo.acuan?.tinggi}). Pilihan ini realistis dan sangat ideal diletakkan sebagai pilihan ke-2.`,
                  yakin: true,
                  kategoriKeyakinan: "Terverifikasi Dokumen Resmi",
                  sumber: [
                    {
                      judul: `Statistik Rerata Nilai SNBT BPPP 2026`,
                      dokumen: `Distribusi Nilai Peserta Diterima - ${prodi.nama} ${ptn?.nama}`,
                      halaman: "Tabel Rentang Interkuartil",
                      url: prodi.sumberUrl,
                      kutipan: `Rentang persaingan kompetitif skor UTBK berada di antara ${pInfo.acuan?.rendah} hingga ${pInfo.acuan?.tinggi}.`,
                    },
                  ],
                  dataDibutuhkan: [],
                  saranPertanyaan: [
                    "Berapa peningkatan poin yang dibutuhkan agar menjadi Safe?",
                    "Bagaimana tren peminat prodi ini tahun lalu?",
                  ],
                };
              } else if (pInfo?.kategori === "REACH") {
                return {
                  jawaban: `Prodi ${prodi.nama} di ${ptn?.singkatan || "PTN"} masuk dalam kategori REACH karena skor Anda (${pInfo.skorSiswa}) masih di bawah batas bawah acuan (${pInfo.acuan?.rendah}), dengan GAP sebesar ${pInfo.gap} poin. Pilihan ini adalah pilihan aspirasi (reach), disarankan didampingi oleh pilihan Safe pada urutan berikutnya.`,
                  yakin: true,
                  kategoriKeyakinan: "Terverifikasi Dokumen Resmi",
                  sumber: [
                    {
                      judul: `Statistik Rerata Nilai SNBT BPPP 2026`,
                      dokumen: `Distribusi Nilai Peserta Diterima - ${prodi.nama} ${ptn?.nama}`,
                      halaman: "Batas Bawah Nilai Diterima",
                      url: prodi.sumberUrl,
                      kutipan: `Batas bawah skor diterima pada siklus acuan adalah ${pInfo.acuan?.rendah}. Nilai di bawah angka ini memerlukan usaha intensif untuk menaikkan skor subtes UTBK.`,
                    },
                  ],
                  dataDibutuhkan: [
                    "Nilai per subtes UTBK untuk memetakan kelemahan materi spesifik",
                  ],
                  saranPertanyaan: [
                    "Subtes apa yang paling berdampak menaikkan skor UTBK?",
                    "Berapa lama waktu ideal untuk menutup gap skor?",
                  ],
                };
              }
            } else {
              // SNBP Context
              return {
                jawaban: `Analisis prodi ${prodi.nama} di ${ptn?.singkatan || "PTN"} untuk jalur SNBP bersifat INDIKATIF dengan tingkat keyakinan ${pInfo?.snbpDetails?.tingkatKeyakinan}. ${pInfo?.snbpDetails?.penjelasan}`,
                yakin: true,
                kategoriKeyakinan: "Terverifikasi Dokumen Resmi",
                sumber: [
                  {
                    judul: "Permendikbudristek No. 48 Tahun 2022",
                    dokumen: "Mekanisme Seleksi Nasional Berdasarkan Prestasi",
                    halaman: "Pasal 6-8",
                    url: prodi.sumberUrl,
                    kutipan:
                      "Komponen pertama dihitung dari rata-rata nilai rapor seluruh mata pelajaran paling sedikit 50%, komponen kedua dihitung dari nilai rapor mata pelajaran pendukung.",
                  },
                ],
                dataDibutuhkan:
                  pInfo?.snbpDetails?.adaAlumni === null
                    ? ["Konfirmasi ketersediaan alumni sekolah di prodi ini"]
                    : [],
                saranPertanyaan: [
                  "Kenapa jalur SNBP tidak memberikan persentase angka pasti?",
                  "Apakah sertifikat lomba dapat menaikkan peluang SNBP?",
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
            ? "Terverifikasi Dokumen Resmi"
            : "Informasi Terbatas / Di Luar Cakupan",
          sumber: matchedDoc.citations,
          dataDibutuhkan: matchedDoc.dataDibutuhkan || [],
          saranPertanyaan: matchedDoc.suggestedQuestions,
        };
      }

      // Check if user is asking about unverified / out-of-scope topics (e.g. Mandiri, passing grade hoaxes, calo)
      const isOutOfScope =
        qLower.includes("mandiri") ||
        qLower.includes("bocoran") ||
        qLower.includes("orang dalam") ||
        qLower.includes("uang pangkal") ||
        qLower.includes("biaya kuliah") ||
        qLower.includes("passing grade");

      if (isOutOfScope) {
        return {
          jawaban:
            "Pertanyaan Anda berkaitan dengan informasi di luar cakupan regulasi resmi SNBP & SNBT (seperti Jalur Seleksi Mandiri perguruan tinggi, besaran Uang Kuliah Tunggal (UKT), atau rumor persentase kelulusan tidak resmi). Dokumen acuan BPPP kami tidak memuat data tersebut demi mencegah disinformasi. Kami sarankan Anda langsung mengonfirmasi ke portal resmi penerimaan universitas terkait atau berkonsultasi dengan Guru BK sekolah.",
          yakin: false,
          kategoriKeyakinan: "Informasi Terbatas / Di Luar Cakupan",
          sumber: [],
          dataDibutuhkan: [],
          saranPertanyaan: [
            "Berapa batas tahun kelulusan untuk SNBT?",
            "Apa saja syarat dokumen eligible SNBP?",
            "Bagaimana cara menghitung GAP skor pada pilihan prodi?",
          ],
        };
      }

      // General verified response
      return {
        jawaban:
          "Sistem JalurKu menggunakan basis data resmi BPPP Kemendikbudristek dan regulasi SNPMB terkini. Seluruh penilaian kelayakan dihitung menggunakan formula deterministik acuan empiris tanpa tebak-tebakan probabilitas semu.",
        yakin: true,
        kategoriKeyakinan: "Terverifikasi Dokumen Resmi",
        sumber: [
          {
            judul: "Portal Resmi SNPMB BPPP Kemendikbudristek",
            dokumen: "Pusat Informasi & Regulasi Seleksi Nasional 2026",
            halaman: "Beranda Informasi Resmi",
            url: "https://snpmb.bppp.kemdikbud.go.id/",
            kutipan:
              "SNPMB adalah seleksi nasional penerimaan mahasiswa baru yang diselenggarakan secara transparan, akuntabel, dan terstandar nasional.",
          },
        ],
        dataDibutuhkan: [],
        saranPertanyaan: [
          "Apa saja syarat kelulusan SNBP?",
          "Berapa batas tahun lulus SNBT?",
          "Bagaimana aturan memilih 4 prodi di SNBT?",
        ],
      };
    };

    console.log(
      JSON.stringify({
        pertanyaan,
        ...(konteks?.prodiId && konteks?.jalur ? { mode: "jelaskan" } : {}),
        konteks: konteks
          ? { prodi_id: konteks.prodiId, jalur: konteks.jalur }
          : undefined,
      }),
    );

    const res = await this.request<any>(
      "/query",
      {
        method: "POST",
        // Backend KonteksQuery (extra="forbid") pakai snake_case: prodi_id, jalur, override.
        // `prodiId` (camelCase) → 422. Mode 'jelaskan' hanya sah bila prodi_id DAN jalur ada
        // (backend field_wajib_kurang), selain itu biarkan default 'tanya'.
        body: JSON.stringify({
          pertanyaan,
          ...(konteks?.prodiId && konteks?.jalur ? { mode: "jelaskan" } : {}),
          konteks: konteks
            ? { prodi_id: konteks.prodiId, jalur: konteks.jalur }
            : undefined,
        }),
      },
      fallbackFn,
    );
    console.log("========================================");
    console.log("output");
    console.log(res.data);

    // Jalur demo: fallbackFn sudah mengembalikan AIQueryResponse lengkap.
    if (res.isFallback) {
      return res.data as AIQueryResponse;
    }

    // Jalur live: backend /query mengembalikan bentuk snake_case yang BERBEDA dari AIQueryResponse
    // (services/query.py → _respons): { jawaban, sumber:[{judul,url,halaman}], yakin,
    // data_dibutuhkan:[{field,pertanyaan}], saran_pertanyaan:[str], fallback, mode,
    // jenis_jawaban, catatan:[str] }. Tanpa adapter ini, UI membaca field camelCase → undefined,
    // itulah sebab metadata (saran, data dibutuhkan, kutipan sumber) hilang di mode live.
    const raw = res.data ?? {};

    // sumber backend: {judul, url, halaman}. RagCitation FE butuh {judul, dokumen, halaman, url,
    // kutipan}. Backend tidak mengekspos `dokumen`/`kutipan` terpisah → default aman.
    const sanitizeCitationUrl = (u: any): string => {
      const urlStr = String(u ?? "").trim();
      if (!urlStr || urlStr.startsWith("file:") || urlStr.startsWith("file:///")) {
        return "https://snpmb.bppp.kemdikbud.go.id";
      }
      return urlStr;
    };

    const sumber = (Array.isArray(raw.sumber) ? raw.sumber : []).map(
      (s: any) => ({
        judul: String(s?.judul ?? ""),
        dokumen: String(s?.judul ?? ""),
        halaman: s?.halaman ?? "",
        url: sanitizeCitationUrl(s?.url),
        kutipan: String(s?.kutipan ?? ""),
      }),
    );

    // data_dibutuhkan backend = [{field, pertanyaan}]; UI merender string → ambil `pertanyaan`.
    const dataDibutuhkan = (
      Array.isArray(raw.data_dibutuhkan) ? raw.data_dibutuhkan : []
    ).map((d: any) =>
      typeof d === "string" ? d : String(d?.pertanyaan ?? ""),
    );

    const yakin = Boolean(raw.yakin);

    const mapped: AIQueryResponse = {
      jawaban: String(raw.jawaban ?? ""),
      yakin,
      // Backend tidak punya `kategoriKeyakinan` → turunkan dari `yakin`.
      kategoriKeyakinan: yakin
        ? "Terverifikasi Dokumen Resmi"
        : "Informasi Terbatas / Di Luar Cakupan",
      sumber,
      dataDibutuhkan,
      saranPertanyaan: Array.isArray(raw.saran_pertanyaan)
        ? raw.saran_pertanyaan.map((x: any) => String(x))
        : [],
    };
    return mapped;
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
      return { ok: false, status: "Offline / Unreachable" };
    }
  }
}

export const apiService = new ApiService();
