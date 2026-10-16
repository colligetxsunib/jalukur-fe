import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PROVINCES_INDONESIA } from '../../data/catalog';
import {
  AkreditasiSekolah,
  NilaiTren,
  RiasecQuestionsResponse,
  RiasecResult,
  StudentProfile,
} from '../../types';
import { BentoCard, Button } from '../ui';
import {
  GraduationCap,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Brain,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { calculateRaporAverage } from '../../services/engine';
import { apiService } from '../../services/api';
import { haptic, HAPTIC } from '../../lib/haptics';

const DIM_LABEL: Record<string, string> = {
  realistis: 'Realistis',
  investigatif: 'Investigatif',
  artistik: 'Artistik',
  sosial: 'Sosial',
  enterprising: 'Enterprising',
  konvensional: 'Konvensional',
};


// Kelas input bersama: 16px (anti auto-zoom iOS), border 2px, fokus brand, palet hangat.
const INPUT =
  'w-full text-base p-2.5 min-h-[48px] bg-[var(--color-cream)] border-2 border-[color-mix(in_srgb,var(--color-ink)_15%,transparent)] ' +
  'rounded-2xl text-[var(--color-ink)] placeholder:text-[color-mix(in_srgb,var(--color-ink)_45%,transparent)] ' +
  'focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30';

export const Step2Profile: React.FC = () => {
  const { profile, saveFullProfile, setCurrentStep, showToast } = useApp();

  const [form, setForm] = useState<StudentProfile>(profile);

  // --- Tes Minat RIASEC (kuesioner 24 item, deterministik) ---
  const [instrumen, setInstrumen] = useState<RiasecQuestionsResponse | null>(null);
  const [jawabanRiasec, setJawabanRiasec] = useState<Record<string, number>>({});
  const [riasecResult, setRiasecResult] = useState<RiasecResult | null>(null);
  const [isScoring, setIsScoring] = useState(false);

  // Sync state if context profile changes (e.g. from loading persona)
  React.useEffect(() => {
    setForm(profile);
  }, [profile]);

  // Ambil instrumen RIASEC (GET /riasec/questions, fallback lokal via api service)
  useEffect(() => {
    let active = true;
    apiService
      .getRiasecQuestions()
      .then((d) => active && setInstrumen(d))
      .catch(() => {
        /* fallback sudah ditangani di api service */
      });
    return () => {
      active = false;
    };
  }, []);

  const handleRaporChange = (subject: keyof StudentProfile['nilaiRapor'], val: string) => {
    const num = val === '' ? 0 : Math.min(100, Math.max(0, parseFloat(val) || 0));
    setForm((prev) => ({
      ...prev,
      nilaiRapor: {
        ...prev.nilaiRapor,
        [subject]: num,
      },
    }));
  };

  const setJawaban = (id: string, val: number) => {
    setJawabanRiasec((prev) => ({ ...prev, [id]: val }));
    haptic(HAPTIC.select);
  };

  // Skor kuesioner RIASEC (POST /riasec/submit, pratinjau tak menyimpan ke server).
  const handleScoreRiasec = async () => {
    if (Object.keys(jawabanRiasec).length === 0) {
      showToast('Jawab minimal satu pernyataan minat dulu ya.');
      return;
    }
    setIsScoring(true);
    try {
      const res = await apiService.submitRiasec(jawabanRiasec, false);
      setRiasecResult(res);
      // Turunkan tag minat dari dimensi teratas agar /explore tetap berfungsi (jembatan).
      const tagsDariDimensi = res.dimensi_teratas.map((d) => `#${DIM_LABEL[d] || d}`);
      const mergedTags = Array.from(new Set([...(form.interestTags || []), ...tagsDariDimensi]));
      setForm((prev) => ({ ...prev, interestTags: mergedTags }));
      haptic(HAPTIC.success);
      showToast(`Minatmu terbaca: Holland Code ${res.holland_code}.`);
    } catch {
      showToast('Gagal menghitung skor minat. Coba lagi ya.');
    } finally {
      setIsScoring(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setForm((prev) => ({
      ...prev,
      interestTags: prev.interestTags.filter((t) => t !== tagToRemove),
    }));
  };

  // Missing data validation banner
  const missingDataFields: string[] = [];
  if (!form.tahunLulus) missingDataFields.push('Tahun Kelulusan');
  if (!form.provinsi) missingDataFields.push('Provinsi');
  if (!form.akreditasiSekolah) missingDataFields.push('Akreditasi Sekolah');
  if (!form.skorTryout || form.skorTryout <= 0) missingDataFields.push('Skor Tryout UTBK (Wajib untuk analisis SNBT)');
  if (calculateRaporAverage(form.nilaiRapor) === 0) missingDataFields.push('Nilai Rapor Semester 1-5');

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await saveFullProfile(form);
    showToast('Profil akademik & preferensi minat berhasil disimpan.');
    setCurrentStep(3);
  };

  const raporAverage = calculateRaporAverage(form.nilaiRapor);

  return (
    <>
      <div className="w-full pb-32 lg:pb-0">
        {/* Header + stat strip (gaya e-learning) */}
        <div className="mb-5">
          <h2 className="font-display text-2xl font-bold text-[var(--color-ink)] tracking-tight">
            Profil Akademik &amp; Minat
          </h2>
          <p className="text-xs sm:text-sm text-[color-mix(in_srgb,var(--color-ink)_60%,transparent)] mt-1">
            Isi riwayat akademik dan minatmu. Boleh belum lengkap — bisa dilengkapi nanti.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-3xl bg-[var(--color-cream-card)] border-2 border-[var(--color-ink)] shadow-[var(--shadow-brutal)] p-3 text-center">
            <div className="font-display text-2xl font-extrabold text-brand-500 tabular-nums leading-none">
              {raporAverage || '—'}
            </div>
            <div className="text-[10px] font-semibold text-[color-mix(in_srgb,var(--color-ink)_60%,transparent)] mt-1 uppercase tracking-wide">
              Rata Rapor
            </div>
          </div>
          <div className="rounded-3xl bg-[var(--color-cream-card)] border-2 border-[var(--color-ink)] shadow-[var(--shadow-brutal)] p-3 text-center">
            <div className="font-display text-2xl font-extrabold text-accent-amber tabular-nums leading-none">
              {Object.keys(jawabanRiasec).length}
            </div>
            <div className="text-[10px] font-semibold text-[color-mix(in_srgb,var(--color-ink)_60%,transparent)] mt-1 uppercase tracking-wide">
              Minat Diisi
            </div>
          </div>
          <div className="rounded-3xl bg-[var(--color-cream-card)] border-2 border-[var(--color-ink)] shadow-[var(--shadow-brutal)] p-3 text-center">
            <div className="font-display text-2xl font-extrabold text-reach tabular-nums leading-none">
              {missingDataFields.length}
            </div>
            <div className="text-[10px] font-semibold text-[color-mix(in_srgb,var(--color-ink)_60%,transparent)] mt-1 uppercase tracking-wide">
              Belum Lengkap
            </div>
          </div>
        </div>

        {/* Warning Banner if data_kurang */}
        {missingDataFields.length > 0 && (
          <BentoCard variant="feature" accent="reach" className="mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-reach shrink-0 mt-0.5" />
              <div className="text-xs text-[color-mix(in_srgb,var(--color-ink)_80%,transparent)] leading-relaxed">
                <strong className="font-semibold block mb-0.5 text-[var(--color-ink)]">
                  Data belum lengkap
                </strong>
                <span>
                  Belum terisi: {missingDataFields.join(', ')}. Status{' '}
                  <span className="font-semibold text-reach">data_kurang</span> akan muncul di
                  pemeriksaan Gate sampai dilengkapi.
                </span>
              </div>
            </div>
          </BentoCard>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section 1: Data Pokok */}
          <BentoCard>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[color-mix(in_srgb,var(--color-ink)_10%,transparent)]">
              <GraduationCap className="w-5 h-5 text-brand-500" />
              <h3 className="font-bold text-sm text-[var(--color-ink)]">1. Data Pokok Siswa &amp; Sekolah</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[color-mix(in_srgb,var(--color-ink)_80%,transparent)] mb-1.5">
                  Tahun Kelulusan <span className="text-danger">*</span>
                </label>
                <select
                  value={form.tahunLulus}
                  onChange={(e) => setForm({ ...form, tahunLulus: parseInt(e.target.value) })}
                  className={INPUT}
                >
                  <option value={2026}>2026 (Kelas 12 berjalan)</option>
                  <option value={2025}>2025 (Gap Year 1 Tahun)</option>
                  <option value={2024}>2024 (Gap Year 2 Tahun)</option>
                  <option value={2022}>2022 (Uji Kasus Gugur Gate &gt; 3 Thn)</option>
                </select>
                <p className="text-[10px] text-[color-mix(in_srgb,var(--color-ink)_60%,transparent)] mt-1">
                  SNBT: 2024–2026. SNBP: hanya 2026.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[color-mix(in_srgb,var(--color-ink)_80%,transparent)] mb-1.5">
                  Provinsi Asal Sekolah <span className="text-danger">*</span>
                </label>
                <select
                  value={form.provinsi}
                  onChange={(e) => setForm({ ...form, provinsi: e.target.value })}
                  className={INPUT}
                >
                  {PROVINCES_INDONESIA.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <p className="text-[10px] text-[color-mix(in_srgb,var(--color-ink)_60%,transparent)] mt-1">Mempengaruhi analisis domisili PTN</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[color-mix(in_srgb,var(--color-ink)_80%,transparent)] mb-1.5">
                  Akreditasi Sekolah <span className="text-danger">*</span>
                </label>
                <select
                  value={form.akreditasiSekolah}
                  onChange={(e) => setForm({ ...form, akreditasiSekolah: e.target.value as AkreditasiSekolah })}
                  className={INPUT}
                >
                  <option value="A">Akreditasi A (Kuota SNBP 40%)</option>
                  <option value="B">Akreditasi B (Kuota SNBP 25%)</option>
                  <option value="C">Akreditasi C (Kuota SNBP 5%)</option>
                  <option value="Belum Terakreditasi">Belum Terakreditasi</option>
                </select>
                <p className="text-[10px] text-[color-mix(in_srgb,var(--color-ink)_60%,transparent)] mt-1">Kunci kuota eligible di PDSS</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[color-mix(in_srgb,var(--color-ink)_80%,transparent)] mb-1.5">
                  Skor Rerata Tryout UTBK
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={300}
                  max={850}
                  value={form.skorTryout || ''}
                  onChange={(e) => setForm({ ...form, skorTryout: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Misal: 620"
                  className={`${INPUT} font-mono tabular-nums`}
                />
                <p className="text-[10px] text-[color-mix(in_srgb,var(--color-ink)_60%,transparent)] mt-1">Rentang 300–850 (evaluasi SNBT)</p>
              </div>
            </div>
          </BentoCard>

          {/* Section 2: Nilai Rapor */}
          <BentoCard>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[color-mix(in_srgb,var(--color-ink)_10%,transparent)]">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-500" />
                <h3 className="font-bold text-sm text-[var(--color-ink)]">
                  2. Nilai Rapor Semester 1–5 (0–100)
                </h3>
              </div>
              <div className="flex items-center gap-2 bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-200 px-3.5 py-1.5 rounded-2xl text-xs font-semibold border border-brand-200 dark:border-brand-500/30 self-start sm:self-auto">
                <span>Rata-rata:</span>
                <span className="text-sm font-bold font-mono tabular-nums">{raporAverage}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-2.5 mb-5">
              {[
                { key: 'matematika', label: 'Matematika' },
                { key: 'fisika', label: 'Fisika' },
                { key: 'kimia', label: 'Kimia' },
                { key: 'biologi', label: 'Biologi' },
                { key: 'ekonomi', label: 'Ekonomi' },
                { key: 'sosiologi', label: 'Sosiologi' },
                { key: 'geografi', label: 'Geografi' },
                { key: 'bahasaIndonesia', label: 'B. Indonesia' },
                { key: 'bahasaInggris', label: 'B. Inggris' },
              ].map(({ key, label }) => (
                <div key={key} className="bg-[var(--color-cream)] p-2.5 rounded-2xl border border-[color-mix(in_srgb,var(--color-ink)_14%,transparent)]/80">
                  <label className="block text-[11px] font-semibold text-[color-mix(in_srgb,var(--color-ink)_80%,transparent)] mb-1 line-clamp-1">
                    {label}
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100}
                    step={0.1}
                    value={form.nilaiRapor[key as keyof StudentProfile['nilaiRapor']] ?? ''}
                    onChange={(e) => handleRaporChange(key as keyof StudentProfile['nilaiRapor'], e.target.value)}
                    className="w-full text-base p-2 min-h-[44px] bg-[var(--color-cream-card)] border-2 border-[color-mix(in_srgb,var(--color-ink)_14%,transparent)] rounded-xl text-[var(--color-ink)] text-center font-mono tabular-nums font-bold focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-[color-mix(in_srgb,var(--color-ink)_10%,transparent)]">
              <div>
                <label className="block text-xs font-semibold text-[color-mix(in_srgb,var(--color-ink)_80%,transparent)] mb-1.5">
                  Tren Nilai Semester 1–5
                </label>
                <select
                  value={form.trenNilai}
                  onChange={(e) => setForm({ ...form, trenNilai: e.target.value as NilaiTren })}
                  className={INPUT}
                >
                  <option value="Naik">Konsisten Naik (Bobot Positif SNBP)</option>
                  <option value="Stabil">Stabil Rata-Rata</option>
                  <option value="Turun">Fluktuatif / Menurun</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[color-mix(in_srgb,var(--color-ink)_80%,transparent)] mb-1.5">
                  Peringkat Paralel (Opsional)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={form.peringkatParalel !== undefined ? form.peringkatParalel : ''}
                  onChange={(e) => setForm({ ...form, peringkatParalel: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Misal: 15 (kosongkan bila tidak ada)"
                  className={`${INPUT} tabular-nums`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[color-mix(in_srgb,var(--color-ink)_80%,transparent)] mb-1.5">
                  Total Siswa Se-Angkatan (Opsional)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={10}
                  value={form.totalSiswaAngkatan !== undefined ? form.totalSiswaAngkatan : ''}
                  onChange={(e) => setForm({ ...form, totalSiswaAngkatan: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Misal: 300 (kosongkan bila tidak ada)"
                  className={`${INPUT} tabular-nums`}
                />
              </div>
            </div>
          </BentoCard>

          {/* Section 3: Tes Minat RIASEC (kuesioner 24 item, deterministik) */}
          <BentoCard>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[color-mix(in_srgb,var(--color-ink)_10%,transparent)]">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-brand-500" />
                <h3 className="font-bold text-sm text-[var(--color-ink)]">3. Tes Minat (RIASEC)</h3>
              </div>
              {instrumen && (
                <span className="text-[11px] text-[color-mix(in_srgb,var(--color-ink)_60%,transparent)] font-semibold tabular-nums">
                  {Object.keys(jawabanRiasec).length} / {instrumen.item.length} terjawab
                </span>
              )}
            </div>

            {!instrumen ? (
              <div className="py-8 text-center text-[color-mix(in_srgb,var(--color-ink)_50%,transparent)] text-xs">
                Memuat instrumen tes minat…
              </div>
            ) : (
              <div className="space-y-5">
                <p className="text-xs text-[color-mix(in_srgb,var(--color-ink)_60%,transparent)]">
                  Seberapa suka kamu melakukan aktivitas berikut? (0 = sangat tidak suka, 4 = sangat suka)
                </p>

                {instrumen.dimensi.map((dim) => {
                  const itemsDim = instrumen.item.filter((it) => it.dimensi === dim);
                  if (itemsDim.length === 0) return null;
                  return (
                    <div key={dim}>
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand-700 dark:text-brand-200 bg-brand-50 dark:bg-brand-500/15 px-2.5 py-1 rounded-full border border-brand-200 dark:border-brand-500/30">
                          {DIM_LABEL[dim] || dim}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {itemsDim.map((it) => (
                          <div
                            key={it.id}
                            className="p-3 bg-[var(--color-cream)] rounded-2xl border border-[color-mix(in_srgb,var(--color-ink)_12%,transparent)]"
                          >
                            <span className="text-xs text-[var(--color-ink)] block mb-2 leading-snug">
                              {it.teks}
                            </span>
                            <div className="flex items-center justify-between gap-1.5">
                              {Array.from(
                                { length: instrumen.skala.maks - instrumen.skala.min + 1 },
                                (_, i) => instrumen.skala.min + i
                              ).map((lvl) => (
                                <button
                                  key={lvl}
                                  type="button"
                                  title={instrumen.skala.label?.[String(lvl)] || String(lvl)}
                                  onClick={() => setJawaban(it.id, lvl)}
                                  className={`flex-1 min-h-[44px] rounded-xl text-xs font-bold transition active:scale-95 ${
                                    jawabanRiasec[it.id] === lvl
                                      ? 'bg-brand-500 text-white shadow-xs'
                                      : 'bg-[var(--color-cream-card)] text-[color-mix(in_srgb,var(--color-ink)_80%,transparent)] border border-[color-mix(in_srgb,var(--color-ink)_14%,transparent)]'
                                  }`}
                                >
                                  {lvl}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <Button
                    variant="primary"
                    size="sm"
                    loading={isScoring}
                    loadingText="Menghitung minat…"
                    leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                    onClick={handleScoreRiasec}
                  >
                    Lihat Hasil Minatku
                  </Button>
                  <span className="text-[11px] text-[color-mix(in_srgb,var(--color-ink)_60%,transparent)]">
                    Skoring deterministik ({instrumen.versi_instrumen}) — boleh jawab sebagian.
                  </span>
                </div>

                {/* Hasil vektor RIASEC */}
                {riasecResult && (
                  <div className="rounded-2xl border-2 border-brand-200 dark:border-brand-500/30 bg-brand-50/60 dark:bg-brand-500/10 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[color-mix(in_srgb,var(--color-ink)_60%,transparent)] uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5 text-safe" />
                        Hasil tes minat
                      </span>
                      <span className="font-mono font-extrabold text-brand-600 dark:text-brand-200 text-lg tracking-[0.15em]">
                        {riasecResult.holland_code}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {Object.keys(DIM_LABEL).map((d) => {
                        const v = riasecResult.skor_norm[d] ?? 0;
                        return (
                          <div key={d} className="flex items-center gap-2">
                            <span className="w-24 text-[11px] text-[color-mix(in_srgb,var(--color-ink)_75%,transparent)] shrink-0">
                              {DIM_LABEL[d]}
                            </span>
                            <div className="flex-1 h-2 rounded-full bg-[color-mix(in_srgb,var(--color-ink)_12%,transparent)] overflow-hidden">
                              <span
                                className="block h-full rounded-full bg-brand-500 transition-[width] duration-500"
                                style={{ width: `${Math.round(v * 100)}%` }}
                              />
                            </div>
                            <span className="w-9 text-right text-[11px] font-mono tabular-nums text-[color-mix(in_srgb,var(--color-ink)_60%,transparent)]">
                              {v.toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-3 text-[11px] text-[color-mix(in_srgb,var(--color-ink)_60%,transparent)] leading-relaxed">
                      {riasecResult.catatan}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Active Interest Tags */}
            {form.interestTags && form.interestTags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[color-mix(in_srgb,var(--color-ink)_10%,transparent)]">
                <span className="text-[11px] font-bold text-[color-mix(in_srgb,var(--color-ink)_50%,transparent)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-brand-500" />
                  Tag minat terstruktur:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {form.interestTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 min-h-[32px] bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-200 rounded-full text-xs font-semibold border border-brand-200 dark:border-brand-500/30"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        aria-label={`Hapus ${tag}`}
                        className="text-brand-400 hover:text-brand-800 dark:hover:text-brand-200 text-sm font-bold ml-0.5 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </BentoCard>
        </form>
      </div>

      {/* STICKY BOTTOM CTA — zona jempol */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 lg:static lg:border-0 lg:bg-transparent lg:backdrop-blur-none lg:mt-6 border-t border-[color-mix(in_srgb,var(--color-ink)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-cream-card)_92%,transparent)] backdrop-blur-md"
        style={{ paddingBottom: 'calc(0.75rem + var(--safe-bottom))' }}
      >
        <div className="w-full px-4 pt-3 lg:px-0 lg:pt-0">
          <Button
            variant="primary"
            brutal
            block
            size="lg"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={() => handleSubmit()}
          >
            Simpan &amp; Lanjut ke Target Prodi
          </Button>
        </div>
      </div>
    </>
  );
};
