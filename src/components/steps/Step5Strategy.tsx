import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';
import { JalurType, StrategyEvaluation } from '../../types';
import { PRODI_LIST, PTN_LIST } from '../../data/catalog';
import {
  Sliders,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  Award,
  Layers,
  ArrowLeftRight,
} from 'lucide-react';
import { assessTargetProdi } from '../../services/engine';

export const Step5Strategy: React.FC = () => {
  const {
    profile,
    strategyChoices,
    setStrategyChoices,
    updateStrategyChoice,
    whatIfSkorTryout,
    setWhatIfSkorTryout,
    resetWhatIf,
    setCurrentStep,
    showToast,
  } = useApp();

  const [evaluation, setEvaluation] = useState<StrategyEvaluation | null>(null);

  // Active what-if score (defaults to profile tryout score or 620)
  const effectiveScore = whatIfSkorTryout ?? profile.skorTryout ?? 620;

  // Run strategy evaluation whenever choices or whatIfSkorTryout changes
  useEffect(() => {
    const runEvaluation = async () => {
      if (strategyChoices.length === 0) return;
      const evalRes = await apiService.evaluateStrategy(
        profile,
        strategyChoices,
        whatIfSkorTryout ? { skorTryout: whatIfSkorTryout } : undefined
      );
      setEvaluation(evalRes);
    };

    runEvaluation();
  }, [profile, strategyChoices, whatIfSkorTryout]);

  // Handle re-ordering choices (e.g. Move up/down)
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= strategyChoices.length) return;

    const copy = [...strategyChoices];
    const temp = copy[index];
    copy[index] = copy[newIdx];
    copy[newIdx] = temp;

    // Reassign urutan 1, 2, 3, 4
    const updated = copy.map((c, i) => ({ ...c, urutan: i + 1 }));
    setStrategyChoices(updated);
    localStorage.setItem('jalurku_strategy_choices', JSON.stringify(updated));
  };

  const handleApplySwap = (targetProdiId: string, replacementProdiId: string) => {
    const updated = strategyChoices.map((c) => {
      if (c.prodiId === targetProdiId) {
        return { ...c, prodiId: replacementProdiId };
      }
      return c;
    });
    setStrategyChoices(updated);
    localStorage.setItem('jalurku_strategy_choices', JSON.stringify(updated));
    showToast('Saran swap otomatis berhasil diterapkan.');
  };

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-10 px-4 sm:px-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Langkah 5: Simulator Strategi & Skenario What-If
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Susun urutan 4 pilihan prodi, periksa aturan diversifikasi, dan simulasikan lonjakan skor secara real-time.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCurrentStep(6)}
          className="self-start sm:self-auto px-5 py-3 min-h-[44px] bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-2xl font-bold text-xs shadow-md shadow-blue-600/20 transition flex items-center gap-2 shrink-0 cursor-pointer active:scale-95"
        >
          <span>Lanjut ke Ringkasan Final</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Choices Configuration (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Strategy Choices Order List */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs transition-colors duration-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Urutan Prioritas Pilihan (Pilihan 1 - 4)
                </h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                {strategyChoices.length} Pilihan Terkonfigurasi
              </span>
            </div>

            {strategyChoices.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                Belum ada pilihan prodi di shortlist. Tambahkan prodi di Langkah 3.
              </div>
            ) : (
              <div className="space-y-3">
                {strategyChoices.map((choice, index) => {
                  const prodi = PRODI_LIST.find((p) => p.id === choice.prodiId);
                  if (!prodi) return null;
                  const ptn = PTN_LIST.find((p) => p.id === prodi.ptnId);

                  // Calculate assessment with whatIf override
                  const assessment = assessTargetProdi(
                    profile,
                    prodi,
                    choice.jalur,
                    whatIfSkorTryout
                  );
                  const kategori = assessment.penilaian?.kategori || 'BELUM_ADA_ACUAN';

                  return (
                    <div
                      key={`${choice.urutan}-${choice.prodiId}`}
                      className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-blue-600 dark:bg-blue-500 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                          #{choice.urutan}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                              {ptn?.singkatan} • {prodi.nama}
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                              {choice.jalur}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span>Daya Tampung: {prodi.dayaTampungSNBT} Kursi</span>
                            <span>•</span>
                            <span
                              className={`font-bold font-mono ${
                                kategori === 'SAFE'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : kategori === 'MATCH'
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : kategori === 'REACH'
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-slate-400 dark:text-slate-500'
                              }`}
                            >
                              Status: {kategori.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right actions: Jalur toggle & Move buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <select
                          value={choice.jalur}
                          onChange={(e) =>
                            updateStrategyChoice(
                              choice.urutan,
                              choice.prodiId,
                              e.target.value as JalurType
                            )
                          }
                          className="text-xs font-semibold py-2 px-3 min-h-[40px] border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        >
                          <option value="SNBT" className="bg-white dark:bg-slate-800">Jalur SNBT</option>
                          <option value="SNBP" className="bg-white dark:bg-slate-800">Jalur SNBP</option>
                        </select>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMove(index, 'up')}
                            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 disabled:opacity-30 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer"
                            title="Geser Prioritas Naik"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            disabled={index === strategyChoices.length - 1}
                            onClick={() => handleMove(index, 'down')}
                            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 disabled:opacity-30 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer"
                            title="Geser Prioritas Turun"
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Strategy Evaluation & Composition Warnings */}
          {evaluation && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs transition-colors duration-200">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Evaluasi Keseimbangan Komposisi Pilihan
                  </h3>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    evaluation.isBalanced
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                  }`}
                >
                  {evaluation.isBalanced ? '✓ Komposisi Seimbang' : '⚠ Perlu Penyesuaian'}
                </span>
              </div>

              {/* Composition counts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 text-center">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block">SAFE</span>
                  <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-300 font-mono">
                    {evaluation.safeCount}
                  </span>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-2xl border border-blue-200 dark:border-blue-800">
                  <span className="text-[10px] font-bold text-blue-800 dark:text-blue-300 block">MATCH</span>
                  <span className="text-base font-extrabold text-blue-700 dark:text-blue-300 font-mono">
                    {evaluation.matchCount}
                  </span>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-2xl border border-amber-200 dark:border-amber-800">
                  <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 block">REACH</span>
                  <span className="text-base font-extrabold text-amber-700 dark:text-amber-300 font-mono">
                    {evaluation.reachCount}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">LAINNYA</span>
                  <span className="text-base font-extrabold text-slate-700 dark:text-slate-300 font-mono">
                    {evaluation.belumAdaAcuanCount}
                  </span>
                </div>
              </div>

              {/* Warnings list */}
              {evaluation.warnings.length > 0 && (
                <div className="space-y-2 mb-4">
                  {evaluation.warnings.map((w, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Auto Swap Suggestion Card */}
              {evaluation.saranSwap && evaluation.saranSwap.length > 0 && (
                <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 rounded-3xl border border-blue-200 dark:border-blue-900">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowLeftRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h4 className="font-bold text-xs text-blue-950 dark:text-blue-200">
                      Saran Swap Otomatis untuk Mengamankan Strategi:
                    </h4>
                  </div>
                  {evaluation.saranSwap.map((swap, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-blue-900 dark:text-blue-200 space-y-2.5 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-blue-100 dark:border-slate-800"
                    >
                      <p className="leading-relaxed">{swap.alasan}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="font-semibold text-blue-700 dark:text-blue-300">
                          Rekomendasi Swap: {swap.rekomendasiNama}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleApplySwap(swap.prodiIdTarget, swap.rekomendasiPenggantiProdiId)
                          }
                          className="px-4 py-2 min-h-[38px] bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-2xs transition self-start sm:self-auto cursor-pointer"
                        >
                          Terapkan Swap
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Interactive What-If Simulator Panel (Fitur Unggulan) */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-indigo-800/50 dark:border-slate-800 relative lg:sticky lg:top-28">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm tracking-tight">Panel Simulator What-If</h3>
              </div>
              {whatIfSkorTryout !== undefined && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-400/20 text-amber-300 rounded border border-amber-400/40">
                  Mode Simulasi
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Geser slider skor simulasi untuk melihat perubahan status kelayakan Safe/Match/Reach secara
              langsung tanpa merusak data asli profil Anda.
            </p>

            {/* Slider Skor UTBK */}
            <div className="space-y-3 mb-6 bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-semibold">Skor Tryout UTBK:</span>
                <span className="text-lg font-extrabold text-amber-400 font-mono">
                  {effectiveScore}
                </span>
              </div>

              {/* Range Input with 44px touch height */}
              <div className="py-2">
                <input
                  type="range"
                  min={400}
                  max={800}
                  step={5}
                  value={effectiveScore}
                  onChange={(e) => setWhatIfSkorTryout(parseInt(e.target.value))}
                  className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>400</span>
                <span>600 (Median)</span>
                <span>800 (Top 1%)</span>
              </div>
            </div>

            {/* Real-time category impact preview */}
            <div className="space-y-2 mb-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Dampak Pada Pilihan Saat Ini:
              </span>
              <div className="space-y-1.5">
                {strategyChoices.map((c) => {
                  const prodi = PRODI_LIST.find((p) => p.id === c.prodiId);
                  if (!prodi) return null;
                  const assessment = assessTargetProdi(profile, prodi, c.jalur, whatIfSkorTryout);
                  const cat = assessment.penilaian?.kategori || 'BELUM_ADA_ACUAN';

                  return (
                    <div
                      key={c.urutan}
                      className="flex items-center justify-between text-xs p-2.5 bg-white/5 rounded-2xl border border-white/5"
                    >
                      <span className="line-clamp-1 text-slate-300 text-[11px]">
                        #{c.urutan} {prodi.nama}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg font-mono ${
                          cat === 'SAFE'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : cat === 'MATCH'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : cat === 'REACH'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-500/20 text-slate-400'
                        }`}
                      >
                        {cat}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reset Button */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetWhatIf}
                disabled={whatIfSkorTryout === undefined}
                className="w-full py-3 min-h-[44px] bg-white/10 hover:bg-white/20 disabled:opacity-40 text-slate-200 rounded-2xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ke Profil Asli</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
