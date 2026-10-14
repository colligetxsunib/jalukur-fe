import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';
import { AssessmentResult, JalurType } from '../../types';
import { PRODI_LIST, PTN_LIST } from '../../data/catalog';
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

export const Step4Analyze: React.FC = () => {
  const {
    profile,
    shortlist,
    updateProfile,
    setCurrentStep,
    openAiDrawer,
    showToast,
  } = useApp();

  const [assessments, setAssessments] = useState<AssessmentResult[]>([]);
  const [activeJalurMap, setActiveJalurMap] = useState<Record<string, JalurType>>({});

  // Inline edit state for missing data (e.g. tryout score if data_kurang)
  const [inlineTryoutInput, setInlineTryoutInput] = useState<number | undefined>(profile.skorTryout);

  // Load assessments
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
    const updatedAlumni = {
      ...(profile.alumniDiterima || {}),
      [prodiId]: value,
    };
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

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-10 px-4 sm:px-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Langkah 4: Analisis Kelayakan Target (Gate & Penilaian)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pengecekan bertingkat: Syarat Mutlak (Gate) disaring terlebih dahulu sebelum evaluasi kategori Safe/Match/Reach.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCurrentStep(5)}
          className="self-start sm:self-auto px-5 py-3 min-h-[44px] bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-2xl font-bold text-xs shadow-md shadow-blue-600/20 transition flex items-center gap-2 shrink-0 cursor-pointer active:scale-95"
        >
          <span>Lanjut ke Simulator What-If</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {shortlist.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">Shortlist Target Masih Kosong</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Kembalilah ke Langkah 3 untuk memilih minimal 1 program studi yang ingin dianalisis.
          </p>
          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className="px-5 py-2.5 min-h-[44px] bg-blue-600 dark:bg-blue-500 text-white text-xs font-bold rounded-2xl"
          >
            Pilih Target di Langkah 3
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {shortlist.map((prodiId) => {
            const prodi = PRODI_LIST.find((p) => p.id === prodiId);
            if (!prodi) return null;
            const ptn = PTN_LIST.find((p) => p.id === prodi.ptnId);

            // Active jalur toggle for this card (default: SNBT)
            const activeJalur = activeJalurMap[prodiId] || 'SNBT';

            // Find matching assessment
            const assessment = assessments.find(
              (a) => a.prodiId === prodiId && a.jalur === activeJalur
            );

            if (!assessment) return null;

            const gate = assessment.gate;
            const penilaian = assessment.penilaian;

            return (
              <div
                key={prodiId}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-200"
              >
                {/* Card Header */}
                <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-50 via-white to-blue-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-600 dark:bg-blue-500 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                      {ptn?.singkatan}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{prodi.nama}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {ptn?.nama}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {prodi.rumpun} • Akreditasi {prodi.akreditasi} • {ptn?.provinsi}
                      </p>
                    </div>
                  </div>

                  {/* Jalur Selector Toggle (SNBT vs SNBP) */}
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-full sm:w-auto justify-center border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveJalurMap((prev) => ({ ...prev, [prodiId]: 'SNBT' }))
                      }
                      className={`flex-1 sm:flex-initial px-3 py-1.5 min-h-[38px] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeJalur === 'SNBT'
                          ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <span>Jalur UTBK-SNBT</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveJalurMap((prev) => ({ ...prev, [prodiId]: 'SNBP' }))
                      }
                      className={`flex-1 sm:flex-initial px-3 py-1.5 min-h-[38px] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeJalur === 'SNBP'
                          ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <span>Jalur SNBP (Rapor)</span>
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
                  {/* TAHAP 1: GATE (SYARAT MUTLAK) */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        Tahap 1: Verifikasi Syarat Mutlak (Gate)
                      </span>
                      <span
                        className={`text-[11px] font-bold px-3 py-1 rounded-full border self-start sm:self-auto ${
                          gate.status === 'lolos'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70'
                            : gate.status === 'gagal'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/70'
                            : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70'
                        }`}
                      >
                        {gate.status === 'lolos'
                          ? '✓ Lolos Seluruh Syarat Mutlak'
                          : gate.status === 'gagal'
                          ? '✕ Gagal Syarat Mutlak'
                          : '⚠ Data Kurang (Perlu Dilengkapi)'}
                      </span>
                    </div>

                    {/* Requirements checklist items */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {gate.syarat.map((s, idx) => (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-2xl border text-xs flex flex-col justify-between ${
                            s.status === 'lolos'
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60'
                              : s.status === 'gagal'
                              ? 'bg-rose-50/60 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60'
                              : 'bg-amber-50/60 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{s.nama}</span>
                              {s.status === 'lolos' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              ) : s.status === 'gagal' ? (
                                <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">{s.keterangan}</p>
                            <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">{s.alasan}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* HARD RULE ALERT: IF GATE FAILED, SHOW RED BOX AND HIDE SCORING */}
                    {gate.status === 'gagal' && (
                      <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-950/60 rounded-3xl border border-rose-300 dark:border-rose-800/80 flex items-start gap-3">
                        <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-rose-900 dark:text-rose-200 text-sm mb-0.5">
                            Jalur Tidak Memenuhi Syarat Mutlak (Gugur Gate)
                          </h4>
                          <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
                            {gate.alasanGagal}
                          </p>
                          <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-2 italic font-medium">
                            * Sesuai ketentuan sistem PRD, perhitungan kategori Safe/Match/Reach
                            otomatis dihentikan untuk mencegah estimasi peluang yang keliru.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* INLINE FORM IF DATA_KURANG */}
                    {gate.status === 'data_kurang' && (
                      <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/60 rounded-3xl border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <h4 className="font-bold text-amber-900 dark:text-amber-200 text-xs">
                            Lengkapi Data Tanpa Menebak:
                          </h4>
                        </div>
                        {activeJalur === 'SNBT' && (!profile.skorTryout || profile.skorTryout <= 0) && (
                          <div className="flex flex-col sm:flex-row gap-2 items-center">
                            <span className="text-xs text-amber-900 dark:text-amber-200">Masukkan Skor Tryout Anda:</span>
                            <input
                              type="number"
                              min={300}
                              max={850}
                              placeholder="300 - 850"
                              value={inlineTryoutInput || ''}
                              onChange={(e) =>
                                setInlineTryoutInput(
                                  e.target.value ? parseInt(e.target.value) : undefined
                                )
                              }
                              className="px-3 py-2 text-base sm:text-xs min-h-[40px] bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 w-32 font-mono"
                            />
                            <button
                              type="button"
                              onClick={handleSaveInlineTryout}
                              className="px-4 py-2 min-h-[40px] bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              Hitung Kategori
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* TAHAP 2: PENILAIAN (HANYA JIKA LOLOS GATE) */}
                  {gate.lolos && penilaian && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          Tahap 2: Penilaian Kelayakan Empiris
                        </span>
                      </div>

                      {/* SNBT ASSESSMENT CARD */}
                      {activeJalur === 'SNBT' && (
                        <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-semibold">
                                Hasil Kategori Kelayakan
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span
                                  className={`text-sm font-extrabold px-3 py-1 rounded-xl font-mono shadow-2xs ${
                                    penilaian.kategori === 'SAFE'
                                      ? 'bg-emerald-600 dark:bg-emerald-500 text-white'
                                      : penilaian.kategori === 'MATCH'
                                      ? 'bg-blue-600 dark:bg-blue-500 text-white'
                                      : penilaian.kategori === 'REACH'
                                      ? 'bg-amber-500 dark:bg-amber-400 text-white dark:text-slate-950 font-black'
                                      : 'bg-slate-400 dark:bg-slate-600 text-white'
                                  }`}
                                >
                                  {penilaian.kategori.replace('_', ' ')}
                                </span>
                                {penilaian.kategori === 'REACH' && penilaian.gap !== undefined && (
                                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                                    GAP: -{penilaian.gap} Poin
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Benchmark Numbers */}
                            <div className="text-left sm:text-right text-xs">
                              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                                Skor Siswa vs Acuan
                              </span>
                              <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                                {penilaian.skorSiswa}{' '}
                                <span className="text-slate-400 dark:text-slate-500 font-normal">
                                  / (Acuan: {penilaian.acuan?.rendah} - {penilaian.acuan?.tinggi})
                                </span>
                              </span>
                            </div>
                          </div>

                          {/* Visual Benchmark Slider Bar */}
                          {penilaian.acuan?.status === 'tersedia' ? (
                            <div className="space-y-1.5 pt-2">
                              <div className="relative w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                                <div
                                  style={{ width: `${penilaian.posisiPersen || 50}%` }}
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    penilaian.kategori === 'SAFE'
                                      ? 'bg-emerald-500'
                                      : penilaian.kategori === 'MATCH'
                                      ? 'bg-blue-500'
                                      : 'bg-amber-500'
                                  }`}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                <span>Batas Bawah ({penilaian.acuan?.rendah})</span>
                                <span className="font-sans font-semibold text-slate-600 dark:text-slate-400">
                                  * acuan siklus sebelumnya (2026)
                                </span>
                                <span>Batas Atas ({penilaian.acuan?.tinggi})</span>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs text-slate-500 dark:text-slate-400 italic">
                              Status data: <strong>BELUM ADA ACUAN</strong> empiris resmi untuk program studi
                              ini pada siklus sebelumnya.
                            </div>
                          )}
                        </div>
                      )}

                      {/* SNBP ASSESSMENT CARD */}
                      {activeJalur === 'SNBP' && penilaian.snbpDetails && (
                        <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-4">
                          {/* Mandatory Badges: Indikatif & Keyakinan */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-3 py-1 text-xs font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded-xl border border-blue-200 dark:border-blue-900">
                              INDIKATIF
                            </span>
                            <span
                              className={`px-3 py-1 text-xs font-bold rounded-xl border ${
                                penilaian.snbpDetails.tingkatKeyakinan === 'Tinggi'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70'
                                  : penilaian.snbpDetails.tingkatKeyakinan === 'Sedang'
                                  ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/70'
                                  : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70'
                              }`}
                            >
                              Tingkat Keyakinan: {penilaian.snbpDetails.tingkatKeyakinan}
                            </span>
                            <span className="text-[11px] text-rose-600 dark:text-rose-400 italic font-semibold">
                              (Dilarang menampilkan persentase kelulusan)
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {penilaian.snbpDetails.penjelasan}
                          </p>

                          {/* Interactive Alumni Input Toggle */}
                          <div className="p-3.5 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <School className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                Adakah alumni sekolahmu yang diterima di prodi/PTN ini tahun lalu?
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleAlumni(prodiId, true)}
                                className={`px-4 py-1.5 min-h-[40px] text-xs font-bold rounded-xl transition cursor-pointer ${
                                  penilaian.snbpDetails.adaAlumni === true
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
                                }`}
                              >
                                Ada
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleAlumni(prodiId, false)}
                                className={`px-4 py-1.5 min-h-[40px] text-xs font-bold rounded-xl transition cursor-pointer ${
                                  penilaian.snbpDetails.adaAlumni === false
                                    ? 'bg-rose-600 text-white shadow-2xs'
                                    : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
                                }`}
                              >
                                Tidak Ada / Belum Tahu
                              </button>
                            </div>
                          </div>

                          {/* Unknown factors list */}
                          <div className="p-3.5 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                              Faktor Non-Publik yang Hanya Diketahui Internal PTN:
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

                  {/* Card Footer: Metadata & "Kenapa?" Drawer Button */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Terakhir diverifikasi: {assessment.terakhirDiverifikasi}
                      </span>
                      <span>•</span>
                      <a
                        href={assessment.sumberUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline font-bold inline-flex items-center gap-1"
                      >
                        <span>Sumber Portal Resmi</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        openAiDrawer({
                          prodiId,
                          jalur: activeJalur,
                          initialQuestion: `Kenapa prodi ${prodi.nama} masuk dalam kategori ${
                            penilaian?.kategori || 'tersebut'
                          } untuk profil saya?`,
                        })
                      }
                      className="px-4 py-2 min-h-[40px] bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold rounded-xl border border-blue-200 dark:border-blue-800 transition flex items-center justify-center gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Kenapa? (Tanya AI Kontekstual)</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
