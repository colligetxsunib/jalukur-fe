import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';
import { CategoryScore, JalurType, StrategyEvaluation } from '../../types';
import { findPtnById, getProdiOrFallback, PRODI_LIST, PTN_LIST } from '../../data/catalog';
import { BentoCard, Button } from '../ui';
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
import { haptic, HAPTIC } from '../../lib/haptics';

const CAT_TEXT: Record<CategoryScore, string> = {
  SAFE: 'text-safe',
  MATCH: 'text-match',
  REACH: 'text-reach',
  BELUM_ADA_ACUAN: 'text-muted-info',
};
// Varian "pill" di panel gelap (what-if)
const CAT_PILL: Record<CategoryScore, string> = {
  SAFE: 'bg-safe/20 text-safe border border-safe/40',
  MATCH: 'bg-match/20 text-match border border-match/40',
  REACH: 'bg-reach/20 text-reach border border-reach/40',
  BELUM_ADA_ACUAN: 'bg-white/10 text-slate-300',
};

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
  const effectiveScore = whatIfSkorTryout ?? profile.skorTryout ?? 620;

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

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= strategyChoices.length) return;
    const copy = [...strategyChoices];
    const temp = copy[index];
    copy[index] = copy[newIdx];
    copy[newIdx] = temp;
    const updated = copy.map((c, i) => ({ ...c, urutan: i + 1 }));
    setStrategyChoices(updated);
    localStorage.setItem('jalurku_strategy_choices', JSON.stringify(updated));
    haptic(HAPTIC.select);
  };

  const handleApplySwap = (targetProdiId: string, replacementProdiId: string) => {
    const updated = strategyChoices.map((c) =>
      c.prodiId === targetProdiId ? { ...c, prodiId: replacementProdiId } : c
    );
    setStrategyChoices(updated);
    localStorage.setItem('jalurku_strategy_choices', JSON.stringify(updated));
    showToast('Saran swap otomatis berhasil diterapkan.');
  };

  return (
    <>
      <div className="w-full pb-32 lg:pb-0">
        <div className="mb-6">
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Simulator Strategi &amp; What-If
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Susun urutan 4 pilihan, cek keseimbangan, dan geser skor simulasi secara real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Choices + evaluation */}
          <div className="lg:col-span-2 space-y-5">
            <BentoCard>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-brand-500" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Urutan Pilihan (1–4)</h3>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold tabular-nums">
                  {strategyChoices.length} pilihan
                </span>
              </div>

              {strategyChoices.length === 0 ? (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                  Belum ada pilihan. Tambahkan prodi di Langkah 3.
                </div>
              ) : (
                <div className="space-y-3">
                  {strategyChoices.map((choice, index) => {
                    const prodi = getProdiOrFallback(choice.prodiId);
                    const ptn = findPtnById(prodi.ptnId) || PTN_LIST.find((p) => p.id === prodi.ptnId);
                    const assessment = assessTargetProdi(profile, prodi, choice.jalur, whatIfSkorTryout);
                    const kategori: CategoryScore = assessment.penilaian?.kategori || 'BELUM_ADA_ACUAN';

                    return (
                      <div
                        key={`${choice.urutan}-${choice.prodiId}`}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-brand-500 text-white font-extrabold text-xs flex items-center justify-center shrink-0 tabular-nums">
                            #{choice.urutan}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                {ptn?.singkatan || ''} • {prodi?.nama || (prodi as any)?.prodiNama || (prodi as any)?.nama_prodi || ''}
                              </h4>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-200 border border-brand-200 dark:border-brand-500/30">
                                {choice.jalur}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              <span className="tabular-nums">Daya tampung: {prodi?.dayaTampungSNBT ?? 0}</span>
                              <span>•</span>
                              <span className={`font-bold font-mono ${CAT_TEXT[kategori]}`}>
                                {(kategori || '').replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <select
                            value={choice.jalur}
                            onChange={(e) => updateStrategyChoice(choice.urutan, choice.prodiId, e.target.value as JalurType)}
                            className="text-xs font-semibold px-3 min-h-[44px] border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
                          >
                            <option value="SNBT">Jalur SNBT</option>
                            <option value="SNBP">Jalur SNBP</option>
                          </select>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMove(index, 'up')}
                              className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 disabled:opacity-30 text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer active:scale-90"
                              title="Naikkan prioritas"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              disabled={index === strategyChoices.length - 1}
                              onClick={() => handleMove(index, 'down')}
                              className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 disabled:opacity-30 text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer active:scale-90"
                              title="Turunkan prioritas"
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
            </BentoCard>

            {/* Evaluation */}
            {evaluation && (
              <BentoCard>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-brand-500" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Keseimbangan Komposisi</h3>
                  </div>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      evaluation.isBalanced ? 'bg-safe/10 text-safe' : 'bg-reach/10 text-reach'
                    }`}
                  >
                    {evaluation.isBalanced ? '✓ Seimbang' : '⚠ Perlu penyesuaian'}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2.5 mb-4 text-center">
                  {/* kelas statis (Tailwind tak bisa membaca kelas dinamis) */}
                  <div className="p-3 rounded-2xl border bg-safe/5 border-safe/20">
                    <span className="text-[10px] font-bold block text-safe">SAFE</span>
                    <span className="text-base font-extrabold font-mono tabular-nums text-safe">{evaluation.safeCount}</span>
                  </div>
                  <div className="p-3 rounded-2xl border bg-match/5 border-match/20">
                    <span className="text-[10px] font-bold block text-match">MATCH</span>
                    <span className="text-base font-extrabold font-mono tabular-nums text-match">{evaluation.matchCount}</span>
                  </div>
                  <div className="p-3 rounded-2xl border bg-reach/5 border-reach/20">
                    <span className="text-[10px] font-bold block text-reach">REACH</span>
                    <span className="text-base font-extrabold font-mono tabular-nums text-reach">{evaluation.reachCount}</span>
                  </div>
                  <div className="p-3 rounded-2xl border bg-muted-info/5 border-muted-info/20">
                    <span className="text-[10px] font-bold block text-muted-info">LAIN</span>
                    <span className="text-base font-extrabold font-mono tabular-nums text-muted-info">{evaluation.belumAdaAcuanCount}</span>
                  </div>
                </div>

                {evaluation.warnings.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {evaluation.warnings.map((w, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-reach/10 rounded-2xl border border-reach/30 text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2.5"
                      >
                        <AlertTriangle className="w-4 h-4 text-reach shrink-0 mt-0.5" />
                        <span className="leading-snug">{w}</span>
                      </div>
                    ))}
                  </div>
                )}

                {evaluation.saranSwap && evaluation.saranSwap.length > 0 && (
                  <div className="p-4 bg-brand-50/70 dark:bg-brand-500/10 rounded-2xl border border-brand-200 dark:border-brand-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowLeftRight className="w-4 h-4 text-brand-500" />
                      <h4 className="font-bold text-xs text-brand-700 dark:text-brand-200">
                        Saran swap otomatis:
                      </h4>
                    </div>
                    {evaluation.saranSwap.map((swap, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-slate-700 dark:text-slate-200 space-y-2.5 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800"
                      >
                        <p className="leading-relaxed">{swap.alasan}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span className="font-semibold text-brand-700 dark:text-brand-200">
                            Rekomendasi: {swap.rekomendasiNama}
                          </span>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApplySwap(swap.prodiIdTarget, swap.rekomendasiPenggantiProdiId)}
                          >
                            Terapkan Swap
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </BentoCard>
            )}
          </div>

          {/* Right: What-If panel (dark control panel accent) */}
          <div className="space-y-6">
            <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border-2 border-slate-800 relative lg:sticky lg:top-28">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-accent-lime" />
                  <h3 className="font-display font-bold text-sm tracking-tight">Simulator What-If</h3>
                </div>
                {whatIfSkorTryout !== undefined && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-accent-lime/20 text-accent-lime rounded border border-accent-lime/40">
                    Mode Simulasi
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                Geser slider skor simulasi — status Safe/Match/Reach berubah langsung, tanpa merusak
                profil aslimu.
              </p>

              <div className="space-y-3 mb-6 bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-semibold">Skor Tryout UTBK:</span>
                  <span className="text-2xl font-extrabold text-accent-lime font-mono tabular-nums">
                    {effectiveScore}
                  </span>
                </div>
                <div className="py-2">
                  <input
                    type="range"
                    min={400}
                    max={800}
                    step={5}
                    value={effectiveScore}
                    onChange={(e) => setWhatIfSkorTryout(parseInt(e.target.value))}
                    className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-accent-lime"
                    aria-label="Skor simulasi UTBK"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono tabular-nums">
                  <span>400</span>
                  <span>600 (Median)</span>
                  <span>800 (Top 1%)</span>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Dampak pada pilihanmu:
                </span>
                <div className="space-y-1.5">
                  {strategyChoices.map((c) => {
                    const prodi = getProdiOrFallback(c.prodiId);
                    const assessment = assessTargetProdi(profile, prodi, c.jalur, whatIfSkorTryout);
                    const cat: CategoryScore = assessment.penilaian?.kategori || 'BELUM_ADA_ACUAN';
                    return (
                      <div
                        key={c.urutan}
                        className="flex items-center justify-between text-xs p-2.5 bg-white/5 rounded-2xl border border-white/5"
                      >
                        <span className="line-clamp-1 text-slate-300 text-[11px] tabular-nums">
                          #{c.urutan} {prodi?.nama || (prodi as any)?.prodiNama || (prodi as any)?.nama_prodi || ''}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg font-mono ${CAT_PILL[cat]}`}>
                          {cat}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={resetWhatIf}
                disabled={whatIfSkorTryout === undefined}
                className="w-full min-h-[48px] bg-white/10 hover:bg-white/20 disabled:opacity-40 text-slate-200 rounded-2xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ke profil asli</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* STICKY BOTTOM CTA */}
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
            onClick={() => setCurrentStep(6)}
          >
            Lanjut ke Ringkasan Final
          </Button>
        </div>
      </div>
    </>
  );
};
