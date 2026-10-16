import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';
import { AssessmentResult, CategoryScore, JalurType } from '../../types';
import { PRODI_LIST, PTN_LIST } from '../../data/catalog';
import { BentoCard, Button } from '../ui';
import {
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  ArrowRight,
  Sparkles,
  School,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

// Peta kategori -> warna semantik token (design.md §2.3)
const KATEGORI_BADGE: Record<CategoryScore, string> = {
  SAFE: 'bg-safe text-white',
  MATCH: 'bg-match text-white',
  REACH: 'bg-reach text-white',
  BELUM_ADA_ACUAN: 'bg-muted-info text-white',
};
const KATEGORI_BAR: Record<CategoryScore, string> = {
  SAFE: 'bg-safe',
  MATCH: 'bg-match',
  REACH: 'bg-reach',
  BELUM_ADA_ACUAN: 'bg-muted-info',
};

export const Step4Analyze: React.FC = () => {
  const { profile, shortlist, updateProfile, setCurrentStep, openAiDrawer, showToast } = useApp();

  const [assessments, setAssessments] = useState<AssessmentResult[]>([]);
  const [activeJalurMap, setActiveJalurMap] = useState<Record<string, JalurType>>({});
  const [inlineTryoutInput, setInlineTryoutInput] = useState<number | undefined>(profile.skorTryout);

  useEffect(() => {
    const fetchAssessments = async () => {
      if (shortlist.length === 0) return;
      try {
        const targets = shortlist.map((id) => ({
          prodiId: id,
          jalur: ['SNBT', 'SNBP'] as JalurType[],
        }));
        const results = await apiService.analyzeTargets(profile, targets);
        setAssessments(results);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAssessments();
  }, [profile, shortlist]);

  const handleToggleAlumni = async (prodiId: string, value: boolean) => {
    const updatedAlumni = { ...(profile.alumniDiterima || {}), [prodiId]: value };
    await updateProfile({ alumniDiterima: updatedAlumni });
    showToast('Data riwayat alumni sekolah diperbarui.');
  };

  const handleSaveInlineTryout = async () => {
    if (!inlineTryoutInput || inlineTryoutInput < 300 || inlineTryoutInput > 850) {
      showToast('Masukkan skor tryout yang valid antara 300 - 850.');
      return;
    }
    await updateProfile({ skorTryout: inlineTryoutInput });
    showToast('Skor tryout UTBK berhasil diperbarui. Menganalisis ulang Gate...');
  };

  const jalurTabClass = (active: boolean) =>
    `flex-1 sm:flex-initial px-3 min-h-[40px] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
      active
        ? 'bg-white dark:bg-slate-700 text-brand-700 dark:text-brand-200 shadow-2xs'
        : 'text-slate-600 dark:text-slate-400'
    }`;

  return (
    <>
      <div className="w-full pb-32 lg:pb-0">
        <div className="mb-6">
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Analisis Kelayakan Target
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Dua tahap: Syarat Mutlak (Gate) disaring dulu, baru kategori Safe/Match/Reach dihitung.
          </p>
        </div>

        {shortlist.length === 0 ? (
          <BentoCard variant="feature" accent="reach" className="text-center py-12">
            <AlertCircle className="w-10 h-10 text-reach mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">Shortlist masih kosong</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Kembali ke Langkah 3 untuk memilih minimal 1 program studi.
            </p>
            <Button variant="primary" size="sm" onClick={() => setCurrentStep(3)} className="mx-auto">
              Pilih Target di Langkah 3
            </Button>
          </BentoCard>
        ) : (
          <div className="space-y-5">
            {shortlist.map((prodiId) => {
              const prodi = PRODI_LIST.find((p) => p.id === prodiId);
              if (!prodi) return null;
              const ptn = PTN_LIST.find((p) => p.id === prodi.ptnId);
              const activeJalur = activeJalurMap[prodiId] || 'SNBT';
              const assessment = assessments.find((a) => a.prodiId === prodiId && a.jalur === activeJalur);
              if (!assessment) return null;

              const gate = assessment.gate;
              const penilaian = assessment.penilaian;

              return (
                <div
                  key={prodiId}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-soft"
                >
                  {/* Card Header */}
                  <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-brand-500 text-white font-extrabold text-sm flex items-center justify-center shrink-0 border-2 border-slate-900/80 dark:border-slate-100/70">
                        {ptn?.singkatan}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">{prodi.nama}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {ptn?.nama}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {prodi.rumpun} • Akreditasi {prodi.akreditasi} • {ptn?.provinsi}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-full sm:w-auto border border-slate-200 dark:border-slate-700">
                      <button type="button" onClick={() => setActiveJalurMap((prev) => ({ ...prev, [prodiId]: 'SNBT' }))} className={jalurTabClass(activeJalur === 'SNBT')}>
                        Jalur UTBK-SNBT
                      </button>
                      <button type="button" onClick={() => setActiveJalurMap((prev) => ({ ...prev, [prodiId]: 'SNBP' }))} className={jalurTabClass(activeJalur === 'SNBP')}>
                        Jalur SNBP (Rapor)
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5 space-y-5">
                    {/* TAHAP 1: GATE */}
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-brand-500" />
                          Tahap 1: Syarat Mutlak (Gate)
                        </span>
                        <span
                          className={`text-[11px] font-bold px-3 py-1 rounded-full border self-start sm:self-auto ${
                            gate.status === 'lolos'
                              ? 'bg-safe/10 text-safe border-safe/30'
                              : gate.status === 'gagal'
                              ? 'bg-danger/10 text-danger border-danger/30'
                              : 'bg-reach/10 text-reach border-reach/30'
                          }`}
                        >
                          {gate.status === 'lolos' ? '✓ Lolos semua syarat' : gate.status === 'gagal' ? '✕ Gagal syarat mutlak' : '⚠ Data kurang'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {gate.syarat.map((s, idx) => (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-2xl border text-xs ${
                              s.status === 'lolos'
                                ? 'bg-safe/5 border-safe/20'
                                : s.status === 'gagal'
                                ? 'bg-danger/5 border-danger/20'
                                : 'bg-reach/5 border-reach/20'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{s.nama}</span>
                              {s.status === 'lolos' ? (
                                <CheckCircle2 className="w-4 h-4 text-safe shrink-0" />
                              ) : s.status === 'gagal' ? (
                                <XCircle className="w-4 h-4 text-danger shrink-0" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-reach shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">{s.keterangan}</p>
                            <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">{s.alasan}</p>
                          </div>
                        ))}
                      </div>

                      {/* Gate GAGAL — box danger, sembunyikan scoring */}
                      {gate.status === 'gagal' && (
                        <div className="mt-4 p-4 bg-danger/10 rounded-3xl border border-danger/30 flex items-start gap-3">
                          <ShieldAlert className="w-6 h-6 text-danger shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-bold text-danger text-sm mb-0.5">
                              Jalur tidak memenuhi syarat mutlak (gugur Gate)
                            </h4>
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{gate.alasanGagal}</p>
                            <p className="text-[11px] text-danger mt-2 italic font-medium">
                              * Perhitungan kategori Safe/Match/Reach dihentikan untuk mencegah estimasi keliru.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* data_kurang — inline input */}
                      {gate.status === 'data_kurang' && (
                        <div className="mt-4 p-4 bg-reach/10 rounded-3xl border border-reach/30">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-reach" />
                            <h4 className="font-bold text-slate-900 dark:text-white text-xs">Lengkapi data tanpa menebak:</h4>
                          </div>
                          {activeJalur === 'SNBT' && (!profile.skorTryout || profile.skorTryout <= 0) && (
                            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                              <span className="text-xs text-slate-700 dark:text-slate-300">Skor tryout kamu:</span>
                              <input
                                type="number"
                                inputMode="numeric"
                                min={300}
                                max={850}
                                placeholder="300 - 850"
                                value={inlineTryoutInput || ''}
                                onChange={(e) => setInlineTryoutInput(e.target.value ? parseInt(e.target.value) : undefined)}
                                className="px-3 text-base min-h-[44px] bg-white dark:bg-slate-800 border-2 border-reach/40 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 w-full sm:w-32 font-mono tabular-nums"
                              />
                              <Button variant="primary" size="sm" onClick={handleSaveInlineTryout}>
                                Hitung Kategori
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* TAHAP 2: PENILAIAN (jika lolos gate) */}
                    {gate.lolos && penilaian && (
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                          <Sparkles className="w-4 h-4 text-brand-500" />
                          Tahap 2: Penilaian Kelayakan
                        </span>

                        {/* SNBT */}
                        {activeJalur === 'SNBT' && (
                          <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-semibold">
                                  Kategori Kelayakan
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`text-sm font-extrabold px-3 py-1 rounded-xl font-mono shadow-2xs ${KATEGORI_BADGE[penilaian.kategori]}`}>
                                    {penilaian.kategori.replace('_', ' ')}
                                  </span>
                                  {penilaian.kategori === 'REACH' && penilaian.gap !== undefined && (
                                    <span className="text-xs font-bold text-reach bg-reach/10 px-2.5 py-1 rounded-xl border border-reach/30 tabular-nums">
                                      GAP: -{penilaian.gap} Poin
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-left sm:text-right text-xs">
                                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Skor Siswa vs Acuan</span>
                                <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100 text-sm">
                                  {penilaian.skorSiswa}{' '}
                                  <span className="text-slate-400 dark:text-slate-500 font-normal">
                                    / (Acuan: {penilaian.acuan?.rendah} - {penilaian.acuan?.tinggi})
                                  </span>
                                </span>
                              </div>
                            </div>

                            {penilaian.acuan?.status === 'tersedia' ? (
                              <div className="space-y-1.5 pt-2">
                                <div className="relative w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                                  <div
                                    style={{ width: `${penilaian.posisiPersen || 50}%` }}
                                    className={`h-full rounded-full transition-[width] duration-500 ${KATEGORI_BAR[penilaian.kategori]}`}
                                  />
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                                  <span>Bawah ({penilaian.acuan?.rendah})</span>
                                  <span className="font-sans">* acuan siklus sebelumnya</span>
                                  <span>Atas ({penilaian.acuan?.tinggi})</span>
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs text-slate-500 dark:text-slate-400 italic">
                                Status: <strong>BELUM ADA ACUAN</strong> empiris resmi untuk prodi ini.
                              </div>
                            )}
                          </div>
                        )}

                        {/* SNBP */}
                        {activeJalur === 'SNBP' && penilaian.snbpDetails && (
                          <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-3 py-1 text-xs font-extrabold bg-match/10 text-match rounded-xl border border-match/30">
                                INDIKATIF
                              </span>
                              <span
                                className={`px-3 py-1 text-xs font-bold rounded-xl border ${
                                  penilaian.snbpDetails.tingkatKeyakinan === 'Tinggi'
                                    ? 'bg-safe/10 text-safe border-safe/30'
                                    : penilaian.snbpDetails.tingkatKeyakinan === 'Sedang'
                                    ? 'bg-match/10 text-match border-match/30'
                                    : 'bg-reach/10 text-reach border-reach/30'
                                }`}
                              >
                                Keyakinan: {penilaian.snbpDetails.tingkatKeyakinan}
                              </span>
                              <span className="text-[11px] text-muted-info italic font-semibold">
                                (tanpa persentase kelulusan)
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {penilaian.snbpDetails.penjelasan}
                            </p>

                            <div className="p-3.5 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <School className="w-4 h-4 text-brand-500 shrink-0" />
                                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                  Ada alumni sekolahmu yang diterima di sini tahun lalu?
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleAlumni(prodiId, true)}
                                  className={`px-4 min-h-[40px] text-xs font-bold rounded-xl transition cursor-pointer active:scale-95 ${
                                    penilaian.snbpDetails.adaAlumni === true
                                      ? 'bg-safe text-white shadow-2xs'
                                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                                  }`}
                                >
                                  Ada
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleAlumni(prodiId, false)}
                                  className={`px-4 min-h-[40px] text-xs font-bold rounded-xl transition cursor-pointer active:scale-95 ${
                                    penilaian.snbpDetails.adaAlumni === false
                                      ? 'bg-danger text-white shadow-2xs'
                                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                                  }`}
                                >
                                  Tidak / Belum tahu
                                </button>
                              </div>
                            </div>

                            <div className="p-3.5 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                Faktor non-publik (hanya diketahui internal PTN):
                              </span>
                              <ul className="list-disc list-inside text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                                {penilaian.snbpDetails.faktorBelumDiketahui.map((f, i) => (
                                  <li key={i}>{f}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer: metadata + "Kenapa?" */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Diverifikasi: {assessment.terakhirDiverifikasi}
                        </span>
                        <span>•</span>
                        <a
                          href={assessment.sumberUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-600 dark:text-brand-200 hover:underline font-bold inline-flex items-center gap-1"
                        >
                          <span>Sumber Resmi</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<HelpCircle className="w-4 h-4 text-brand-500" />}
                        onClick={() =>
                          openAiDrawer({
                            prodiId,
                            jalur: activeJalur,
                            initialQuestion: `Kenapa prodi ${prodi.nama} masuk kategori ${penilaian?.kategori || 'tersebut'} untuk profilku?`,
                          })
                        }
                      >
                        Kenapa? (Tanya AI)
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* STICKY BOTTOM CTA */}
      {shortlist.length > 0 && (
        <div
          className="fixed inset-x-0 bottom-0 z-30 lg:static lg:border-0 lg:bg-transparent lg:backdrop-blur-none lg:mt-6 border-t border-[color-mix(in_srgb,var(--color-stroke)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-cream-card)_94%,transparent)] backdrop-blur-md"
          style={{ paddingBottom: 'calc(0.75rem + var(--safe-bottom))' }}
        >
          <div className="w-full px-4 pt-3 lg:px-0 lg:pt-0">
            <Button
              variant="primary"
              brutal
              block
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => setCurrentStep(5)}
            >
              Lanjut ke Simulator What-If
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
