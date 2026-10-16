import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';
import { ExploreRecommendation, Prodi, PTN } from '../../types';
import { Button } from '../ui';
import {
  Compass,
  Search,
  Plus,
  Check,
  CheckCircle2,
  Building2,
  Briefcase,
  ArrowRight,
  Sparkles,
  Layers,
  TrendingUp,
  Target,
  Award,
} from 'lucide-react';

interface PositionedRecommendation extends ExploreRecommendation {
  rank: number;
  rawX: number;
  rawY: number;
  visualX: number;
  visualY: number;
  shortName: string;
  quadrant: string;
}

const computePositionedRecommendations = (recs: ExploreRecommendation[]): PositionedRecommendation[] => {
  const points: PositionedRecommendation[] = recs.map((rec, idx) => {
    const rawX = rec.kemiripanMinat;
    const rawY = rec.kesesuaianNilai;
    // Safe Bounding Box: X between 14% and 84%, Y between 18% and 78% (top 22% reserved for quadrant title)
    const visualX = 14 + (Math.max(0, Math.min(100, rawX)) / 100) * 70;
    const visualY = 18 + (Math.max(0, Math.min(100, rawY)) / 100) * 60;

    let quadrant = '★ Kuadran Ideal (Prioritas Utama)';
    if (rawX >= 50 && rawY >= 50) {
      quadrant = '★ Kuadran Ideal (Prioritas Utama)';
    } else if (rawX < 50 && rawY >= 50) {
      quadrant = '📈 Potensi Akademis (Nilai Rapor Kuat)';
    } else if (rawX >= 50 && rawY < 50) {
      quadrant = '⚡ Aspirasi Minat (Kejar Skor UTBK)';
    } else {
      quadrant = '🧭 Eksplorasi Alternatif';
    }

    const rawProdiNama = (rec?.prodiNama || (rec as any)?.nama_prodi || (rec as any)?.prodi_nama || (rec as any)?.nama || '');
    const shortName = rawProdiNama
      .replace(/^(Teknik|Program Studi|Ilmu)\s+/i, '')
      .replace(/Desain Komunikasi Visual/i, 'DKV')
      .replace(/Teknologi Informasi \/ Ilmu Komputer/i, 'TI / Ilkom')
      .replace(/Teknologi Informasi/i, 'TI')
      .replace(/Ilmu Komputer/i, 'Ilkom')
      .replace(/Hubungan Internasional/i, 'HI')
      .replace(/Kedokteran Gigi/i, 'Kedokteran Gigi')
      .replace(/Kedokteran Umum/i, 'Kedokteran')
      .trim();

    return {
      ...rec,
      prodiNama: rawProdiNama,
      rank: idx + 1,
      rawX,
      rawY,
      visualX,
      visualY,
      shortName,
      quadrant,
    };
  });

  // Staggered Repulsion: prevent horizontal capsules from overlapping
  const minDeltaX = 14;
  const minDeltaY = 12;
  for (let step = 0; step < 40; step++) {
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[j].visualX - points[i].visualX;
        const dy = points[j].visualY - points[i].visualY;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        if (absX < minDeltaX && absY < minDeltaY) {
          const sepX = (minDeltaX - absX) / 2;
          const sepY = (minDeltaY - absY) / 2;
          const signX = dx >= 0 ? 1 : -1;
          const signY = dy >= 0 ? 1 : -1;

          // If points are perfectly coincident, introduce stagger angle
          const offsetX = absX < 0.2 ? (j % 2 === 0 ? 7 : -7) : signX * sepX;
          const offsetY = absY < 0.2 ? (j > 2 ? 6 : -6) : signY * sepY;

          points[j].visualX = Math.max(14, Math.min(84, points[j].visualX + offsetX));
          points[j].visualY = Math.max(18, Math.min(78, points[j].visualY + offsetY));
          points[i].visualX = Math.max(14, Math.min(84, points[i].visualX - offsetX));
          points[i].visualY = Math.max(18, Math.min(78, points[i].visualY - offsetY));
        }
      }
    }
  }

  return points;
};

export const Step3Explore: React.FC = () => {
  const {
    profile,
    shortlist,
    addToShortlist,
    removeFromShortlist,
    setCurrentStep,
    showToast,
  } = useApp();

  const [activeMode, setActiveMode] = useState<'explore' | 'catalog'>('explore');

  // Explore recommendations state
  const [recommendations, setRecommendations] = useState<ExploreRecommendation[]>([]);
  const [loadingExplore, setLoadingExplore] = useState(false);
  const [selectedRecIndex, setSelectedRecIndex] = useState<number>(0);

  // Catalog state
  const [ptnList, setPtnList] = useState<PTN[]>([]);
  const [prodiList, setProdiList] = useState<Prodi[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPtn, setSelectedPtn] = useState<string>('all');
  const [selectedRumpun, setSelectedRumpun] = useState<string>('all');

  // Load explore recommendations on mount
  useEffect(() => {
    const fetchExplore = async () => {
      setLoadingExplore(true);
      try {
        const recs = await apiService.exploreRecommendations(profile);
        setRecommendations(recs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingExplore(false);
      }
    };

    const fetchCatalog = async () => {
      const [ptns, prodis] = await Promise.all([
        apiService.getPTNList(),
        apiService.getProdiList(),
      ]);
      setPtnList(ptns);
      setProdiList(prodis);
    };

    fetchExplore();
    fetchCatalog();
  }, [profile]);

  // Filter prodi catalog
  const filteredProdis = prodiList.filter((prodi) => {
    const ptn = ptnList.find((p) => p.id === prodi.ptnId);
    const matchesSearch =
      prodi.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ptn && ptn.nama.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ptn && ptn.singkatan.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPtn = selectedPtn === 'all' || prodi.ptnId === selectedPtn;
    const matchesRumpun = selectedRumpun === 'all' || prodi.rumpun === selectedRumpun;

    return matchesSearch && matchesPtn && matchesRumpun;
  });

  const handleNextStep = () => {
    if (shortlist.length === 0) {
      showToast('Pilih minimal 1 prodi ke dalam shortlist sebelum lanjut ke analisis.');
      return;
    }
    setCurrentStep(4);
  };

  return (
    <div className="w-full pb-32 lg:pb-0">
      {/* Step Header */}
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Tentukan Target Prodi
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Eksplorasi rekomendasi berbasis minat &amp; rapor, atau jelajahi katalog 10 PTN.
        </p>
      </div>

      {/* Mode Choice Cards (2 Kartu Pilihan Mode) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button
          type="button"
          onClick={() => setActiveMode('explore')}
          className={`p-5 rounded-3xl border text-left transition flex items-start gap-4 cursor-pointer ${
            activeMode === 'explore'
              ? 'border-brand-500 bg-blue-50/50 dark:bg-blue-950/40 dark:border-brand-500 ring-2 ring-blue-500/20 shadow-xs'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div
            className={`p-3 rounded-2xl shrink-0 ${
              activeMode === 'explore' ? 'bg-brand-500 text-white dark:bg-brand-500' : 'bg-brand-100 dark:bg-blue-950 text-brand-600 dark:text-blue-300'
            }`}
          >
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-slate-900 dark:text-white text-base">
                Belum Punya Target? (Eksplorasi Jurusan)
              </span>
              {activeMode === 'explore' && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-brand-500 dark:bg-brand-500 text-white rounded-md">
                  Aktif
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Melihat 5 rekomendasi jurusan terbaik melalui matriks 2D (Kecocokan Minat x Kelayakan Akademis
              Rapor) beserta opsi PTN terbaiknya.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('catalog')}
          className={`p-5 rounded-3xl border text-left transition flex items-start gap-4 cursor-pointer ${
            activeMode === 'catalog'
              ? 'border-brand-500 bg-blue-50/50 dark:bg-blue-950/40 dark:border-brand-500 ring-2 ring-blue-500/20 shadow-xs'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div
            className={`p-3 rounded-2xl shrink-0 ${
              activeMode === 'catalog' ? 'bg-brand-500 text-white dark:bg-brand-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-slate-900 dark:text-white text-base">
                Sudah Punya Target? (Katalog PTN & Prodi)
              </span>
              {activeMode === 'catalog' && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-brand-500 dark:bg-brand-500 text-white rounded-md">
                  Aktif
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Cari dan filter prodi spesifik dari 10 PTN MVP (UI, UGM, ITB, UNAIR, IPB, UB, ITS, UNHAS,
              UNDIP, UNS) dan tambahkan langsung ke Shortlist.
            </p>
          </div>
        </button>
      </div>

      {/* CONTENT MODE A: EXPLORE RECOMMENDATIONS */}
      {activeMode === 'explore' && (() => {
        const positionedRecs = computePositionedRecommendations(recommendations);
        const selectedRec = positionedRecs[selectedRecIndex] || positionedRecs[0];

        return (
          <div className="space-y-6">
            {/* Matriks Kecocokan x Kelayakan Visual Section */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs transition-colors duration-200">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-3.5 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-brand-500 dark:text-blue-400" />
                    <span>Matriks Kecocokan Minat x Kelayakan Akademis (2D Grid)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Formula deterministik: <code className="font-mono text-brand-500 dark:text-blue-400 bg-brand-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">0.5 * kemiripan_minat + 0.5 * kesesuaian_nilai</code>.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full self-start">
                  Top 5 Rekomendasi Tertinggi
                </span>
              </div>

              {/* SPLIT LAYOUT: GRID 2D DI KIRI (7 cols) + INSPEKTOR DETAIL DI KANAN (5 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* KOLOM KIRI (7 cols): PETA KUADRAN 2D ANALITIK */}
                <div className="lg:col-span-7 space-y-3">
                  {/* Sumbu Y Badge (Atas Luar) */}
                  <div className="flex items-center justify-between px-1">
                    <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-brand-600 dark:text-blue-300 bg-brand-50 dark:bg-blue-950/70 px-3 py-1 rounded-xl border border-blue-200 dark:border-blue-900/60 shadow-2xs">
                      <span>↑ Sumbu Y: Kesesuaian Nilai Rapor (0 - 100)</span>
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 italic hidden sm:inline">
                      Hover / klik pin untuk inspeksi detail
                    </span>
                  </div>

                  {/* Main Chart Area with Y-axis scale on left */}
                  <div className="flex items-stretch gap-2">
                    {/* Y-axis scale column (outside left) */}
                    <div className="flex flex-col justify-between py-2 text-[10px] sm:text-[11px] font-mono text-slate-400 dark:text-slate-500 select-none text-right shrink-0 w-10 sm:w-12">
                      <span>100</span>
                      <span>75</span>
                      <span className="font-bold text-brand-500 dark:text-blue-400 text-[9px] sm:text-[10px]">50 (Ambang)</span>
                      <span>25</span>
                      <span>0</span>
                    </div>

                    {/* 2D Matrix Box */}
                    <div className="relative flex-1 h-80 sm:h-96 rounded-3xl border-2 border-slate-300 dark:border-slate-700 overflow-visible select-none shadow-xs bg-[linear-gradient(to_right,#cbd5e122_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e122_1px,transparent_1px)] bg-[size:25%_25%]">
                      {/* 4 Quadrants Background Grid (2x2) */}
                      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none rounded-3xl overflow-hidden">
                        {/* Top-Left Quadrant */}
                        <div className="bg-sky-50/40 dark:bg-sky-950/20 border-r border-b border-slate-300 dark:border-slate-700/80 p-2.5 sm:p-3 flex flex-col justify-start">
                          <span className="text-[10px] sm:text-xs font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1">
                            📈 Potensi Akademis
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                            Nilai rapor kuat, minat masih rendah
                          </span>
                        </div>

                        {/* Top-Right Quadrant (IDEAL) */}
                        <div className="bg-emerald-50/50 dark:bg-emerald-950/25 border-b border-slate-300 dark:border-slate-700/80 p-2.5 sm:p-3 flex flex-col justify-start items-end text-right">
                          <span className="text-[10px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                            ★ KUADRAN IDEAL (Prioritas Utama)
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 leading-tight">
                            Minat tinggi & didukung nilai rapor
                          </span>
                        </div>

                        {/* Bottom-Left Quadrant */}
                        <div className="bg-slate-100/60 dark:bg-slate-900/50 border-r border-slate-300 dark:border-slate-700/80 p-2.5 sm:p-3 flex flex-col justify-end">
                          <span className="text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            🧭 Eksplorasi Alternatif
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-500 mt-0.5 leading-tight">
                            Minat & nilai perlu ditingkatkan
                          </span>
                        </div>

                        {/* Bottom-Right Quadrant */}
                        <div className="bg-amber-50/50 dark:bg-amber-950/20 p-2.5 sm:p-3 flex flex-col justify-end items-end text-right">
                          <span className="text-[10px] sm:text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                            ⚡ Aspirasi Minat (Kejar Skor UTBK)
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-amber-600/90 dark:text-amber-400/90 mt-0.5 leading-tight">
                            Sangat sesuai minat, dongkrak nilai/tryout
                          </span>
                        </div>
                      </div>

                      {/* Center Sumbu Lines (50/50 Ambang Keseimbangan) */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-full border-t-2 border-dashed border-slate-400/70 dark:border-slate-600" />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="h-full border-l-2 border-dashed border-slate-400/70 dark:border-slate-600" />
                      </div>
                      {/* Center Badge */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
                        <span className="px-2 py-0.5 rounded-md bg-white/95 dark:bg-slate-800/95 border border-slate-300 dark:border-slate-600 text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400 shadow-2xs whitespace-nowrap">
                          (50, 50) Ambang Keseimbangan
                        </span>
                      </div>

                      {/* Active Point Crosshair Guide Lines */}
                      {selectedRec && (
                        <div className="pointer-events-none">
                          {/* Horizontal guide from left (0%) to point's visualX at point's visualY */}
                          <div
                            style={{ bottom: `${selectedRec.visualY}%`, width: `${selectedRec.visualX}%` }}
                            className="absolute left-0 border-b-2 border-dashed border-blue-500/80 dark:border-blue-400/80 transition-all duration-200"
                          />
                          {/* Vertical guide from bottom (0%) to point's visualY at point's visualX */}
                          <div
                            style={{ left: `${selectedRec.visualX}%`, height: `${selectedRec.visualY}%` }}
                            className="absolute bottom-0 border-l-2 border-dashed border-blue-500/80 dark:border-blue-400/80 transition-all duration-200"
                          />
                        </div>
                      )}

                      {/* Unified Interactive Pill Pins for Top 5 Recommendations */}
                      {positionedRecs.map((p, idx) => {
                        const isSelected = selectedRecIndex === idx;
                        return (
                          <div
                            key={p.prodiId}
                            style={{ left: `${p.visualX}%`, bottom: `${p.visualY}%` }}
                            className={`absolute -translate-x-1/2 translate-y-1/2 transition-transform duration-200 ${
                              isSelected ? 'z-30' : 'z-20'
                            }`}
                            onMouseEnter={() => setSelectedRecIndex(idx)}
                            onClick={() => setSelectedRecIndex(idx)}
                          >
                            <button
                              type="button"
                              className={`transition-all duration-200 cursor-pointer whitespace-nowrap ${
                                isSelected
                                  ? 'scale-105 bg-brand-500 text-white dark:bg-brand-500 ring-4 ring-blue-500/30 shadow-lg px-2.5 sm:px-3 py-1.5 rounded-full flex items-center gap-1.5 font-bold text-[11px] sm:text-xs'
                                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-2 border-brand-500 dark:border-blue-400 shadow-md hover:scale-105 px-2 sm:px-2.5 py-1 rounded-full flex items-center gap-1.5 font-semibold text-[10px] sm:text-xs'
                              }`}
                              title={`${p?.prodiNama || (p as any)?.nama_prodi || (p as any)?.prodi_nama || (p as any)?.nama || ''} (Minat: ${p.rawX}%, Nilai: ${p.rawY}%, Total: ${p.skorTotal}%)`}
                            >
                              <span
                                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-extrabold text-[10px] shrink-0 ${
                                  isSelected
                                    ? 'bg-white text-brand-600 dark:text-brand-500'
                                    : p.rank === 1
                                    ? 'bg-brand-500 text-white dark:bg-brand-500'
                                    : 'bg-indigo-600 text-white dark:bg-indigo-500'
                                }`}
                              >
                                #{p.rank}
                              </span>
                              <span className="truncate max-w-[85px] sm:max-w-[110px]">{p.shortName || p?.prodiNama || ''}</span>
                              <span className="font-mono text-[10px] sm:text-[11px] opacity-90">({p.skorTotal}%)</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* X-axis scale row (outside bottom, aligned with the matrix box) */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="w-10 sm:w-12 shrink-0" />
                    <div className="flex-1 flex justify-between px-2 text-[10px] sm:text-[11px] font-mono text-slate-400 dark:text-slate-500 select-none">
                      <span>0</span>
                      <span>25</span>
                      <span className="font-bold text-brand-500 dark:text-blue-400 text-[9px] sm:text-[10px]">50 (Ambang)</span>
                      <span>75</span>
                      <span>100</span>
                    </div>
                  </div>

                  {/* Sumbu X Indicator Outside Matrix (Bottom Right) */}
                  <div className="flex items-center justify-between mt-2 px-1">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      Semakin condong ke kanan atas, jurusan semakin selaras minat & nilai rapor.
                    </span>
                    <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-brand-600 dark:text-blue-300 bg-brand-50 dark:bg-blue-950/70 px-3 py-1 rounded-xl border border-blue-200 dark:border-blue-900/60 shadow-2xs shrink-0 ml-2">
                      <span>Sumbu X: Kecocokan Minat (0 - 100) →</span>
                    </div>
                  </div>

                  {/* Quick Selector Bar #1 to #5 below Chart */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                        Pilih Cepat:
                      </span>
                      {positionedRecs.map((p, idx) => (
                        <button
                          key={p.prodiId}
                          type="button"
                          onClick={() => setSelectedRecIndex(idx)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                            selectedRecIndex === idx
                              ? 'bg-brand-500 text-white shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          <span>#{p.rank}</span>
                          <span>{p.shortName}</span>
                          <span className="font-mono text-[10px] opacity-80">{p.skorTotal}%</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* KOLOM KANAN (5 cols): PANEL INSPEKTOR JURUSAN AKTIF */}
                <div className="lg:col-span-5 space-y-4">
                  {selectedRec && (() => {
                    const activeProdiNama = selectedRec?.prodiNama || (selectedRec as any)?.nama_prodi || (selectedRec as any)?.prodi_nama || (selectedRec as any)?.nama || '';
                    const prodiDetail = prodiList.find((p) => (activeProdiNama && p.nama === activeProdiNama) || (selectedRec?.prodiId && p.id === selectedRec.prodiId));
                    const mapelPenentu = prodiDetail?.mapelPendukung.join(', ') || 'Matematika, Bahasa Indonesia & Bahasa Inggris';

                    return (
                      <div className="p-4 sm:p-5 rounded-3xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-4 shadow-xs">
                        {/* Inspector Header Tabs */}
                        <div className="flex items-center justify-between gap-1 pb-3 border-b border-slate-200 dark:border-slate-700">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Target className="w-4 h-4 text-brand-500 dark:text-blue-400" />
                            <span>Inspektor Jurusan Aktif</span>
                          </span>
                          <div className="flex items-center gap-1">
                            {positionedRecs.map((p, idx) => (
                              <button
                                key={p.prodiId}
                                type="button"
                                onClick={() => setSelectedRecIndex(idx)}
                                className={`w-6 h-6 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center ${
                                  selectedRecIndex === idx
                                    ? 'bg-brand-500 text-white shadow-xs'
                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                                title={p?.prodiNama || (p as any)?.nama_prodi || (p as any)?.prodi_nama || (p as any)?.nama || ''}
                              >
                                #{p.rank}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Selected Major Header & Quadrant Status */}
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand-500 text-white">
                              Peringkat #{selectedRec.rank} Rekomendasi
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-100 text-brand-600 dark:bg-blue-950 dark:text-blue-300">
                              {selectedRec.rumpun}
                            </span>
                          </div>
                          <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                            {activeProdiNama}
                          </h4>
                          <p className="text-xs text-brand-500 dark:text-blue-400 font-semibold mt-1">
                            {selectedRec.quadrant}
                          </p>
                        </div>

                        {/* 3 Visual Score Progress Meters */}
                        <div className="space-y-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                          {/* Total Match Score */}
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-bold text-slate-900 dark:text-white">Skor Kecocokan Total</span>
                              <span className="text-base font-extrabold font-mono text-brand-500 dark:text-blue-400">
                                {selectedRec.skorTotal}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${selectedRec.skorTotal}%` }}
                                className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-300"
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                              Formula: 50% Kemiripan Minat + 50% Kesesuaian Nilai
                            </span>
                          </div>

                          {/* Sumbu X: Minat */}
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-slate-600 dark:text-slate-300 text-[11px]">Sumbu X — Kemiripan Minat</span>
                              <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                                {selectedRec.rawX} / 100
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${selectedRec.rawX}%` }}
                                className="h-full bg-brand-500 rounded-full transition-all duration-300"
                              />
                            </div>
                          </div>

                          {/* Sumbu Y: Nilai Rapor */}
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-slate-600 dark:text-slate-300 text-[11px]">Sumbu Y — Kesesuaian Rapor</span>
                              <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                                {selectedRec.rawY} / 100
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${selectedRec.rawY}%` }}
                                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                              Mapel Penentu: <strong className="text-slate-600 dark:text-slate-400">{mapelPenentu}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Alasan Kecocokan */}
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          <strong className="text-slate-900 dark:text-white block mb-0.5">Rasionalisasi Analisis:</strong>
                          {selectedRec.alasanKecocokan}
                        </div>

                        {/* Contoh Profesi */}
                        {selectedRec.peluangKarir && selectedRec.peluangKarir.length > 0 && (
                          <div>
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                              Contoh Peluang Karir / Profesi:
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {selectedRec.peluangKarir.map((karir) => (
                                <span
                                  key={karir}
                                  className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium shadow-2xs"
                                >
                                  {karir}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Available PTN options with 1-click shortlist action */}
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                            Pilihan PTN untuk Shortlist:
                          </span>
                          <div className="space-y-2">
                            {selectedRec.ptnTersedia.map((ptnOpt) => {
                              const selProdiNama = selectedRec?.prodiNama || (selectedRec as any)?.nama_prodi || (selectedRec as any)?.prodi_nama || (selectedRec as any)?.nama || '';
                              const matchingProdi = prodiList.find(
                                (p) => p.ptnId === ptnOpt.ptnId && ((selProdiNama && p.nama === selProdiNama) || (selectedRec?.prodiId && p.id === selectedRec.prodiId))
                              );
                              if (!matchingProdi) return null;
                              const isShortlisted = shortlist.includes(matchingProdi.id);

                              return (
                                <div
                                  key={ptnOpt.ptnId}
                                  className={`p-2.5 rounded-2xl border text-xs flex items-center justify-between transition ${
                                    isShortlisted
                                      ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                  }`}
                                >
                                  <div>
                                    <span className="font-bold text-slate-900 dark:text-white block">
                                      {ptnOpt.ptnNama}
                                    </span>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                                      <span>Akred: {ptnOpt.akreditasiProdi}</span>
                                      <span>•</span>
                                      <span>SNBT: {ptnOpt.dayaTampungSNBT} Kursi</span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isShortlisted) {
                                        removeFromShortlist(matchingProdi.id);
                                        showToast(`Menghapus ${matchingProdi?.nama || ''} (${ptnOpt.ptnNama}) dari shortlist.`);
                                      } else {
                                        addToShortlist(matchingProdi.id);
                                        showToast(`Menambahkan ${matchingProdi?.nama || ''} (${ptnOpt.ptnNama}) ke shortlist.`);
                                      }
                                    }}
                                    className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition cursor-pointer flex items-center gap-1 ${
                                      isShortlisted
                                        ? 'bg-emerald-600 text-white hover:bg-rose-600'
                                        : 'bg-brand-50 dark:bg-blue-950 text-brand-600 dark:text-blue-300 hover:bg-brand-500 hover:text-white'
                                    }`}
                                  >
                                    {isShortlisted ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                    <span>{isShortlisted ? 'Terpilih' : 'Tambah'}</span>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

          {/* Top 5 Recommendation List Cards */}
          <div className="space-y-4">
            {loadingExplore ? (
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <div className="w-8 h-8 border-3 border-brand-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-500 dark:text-slate-400">Mengkalkulasi rekomendasi deterministik profil Anda...</p>
              </div>
            ) : (
              recommendations.map((rec, idx) => (
                <div
                  key={rec.prodiId}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs hover:border-blue-300 dark:hover:border-brand-600 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-900 text-brand-600 dark:text-blue-300 flex items-center justify-center font-bold text-sm shrink-0">
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-slate-900 dark:text-white">
                            {rec?.prodiNama || (rec as any)?.nama_prodi || (rec as any)?.prodi_nama || (rec as any)?.nama || ''}
                          </h4>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              rec.rumpun === 'Saintek'
                                ? 'bg-brand-50 text-brand-600 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                                : 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
                            }`}
                          >
                            {rec.rumpun}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {rec.alasanKecocokan}
                        </p>
                      </div>
                    </div>

                    {/* Score Badges */}
                    <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-700/80">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                          Skor Kesesuaian
                        </span>
                        <span className="text-lg font-extrabold text-brand-600 dark:text-blue-400 font-mono">
                          {rec.skorTotal}%
                        </span>
                      </div>
                      <div className="flex gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                        <span>Minat: <strong className="text-slate-800 dark:text-slate-200">{rec.kemiripanMinat}%</strong></span>
                        <span>•</span>
                        <span>Nilai: <strong className="text-slate-800 dark:text-slate-200">{rec.kesesuaianNilai}%</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Career opportunities */}
                  <div className="mb-4">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      Prospek Karir Utama:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {rec.peluangKarir.map((karir) => (
                        <span
                          key={karir}
                          className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium"
                        >
                          {karir}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Available PTNs offering this prodi */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      Pilihan PTN yang Membuka Jurusan Ini:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {rec.ptnTersedia.map((ptnOpt) => {
                        const recProdiNama = rec?.prodiNama || (rec as any)?.nama_prodi || (rec as any)?.prodi_nama || (rec as any)?.nama || '';
                        const matchingProdi = prodiList.find(
                          (p) => p.ptnId === ptnOpt.ptnId && ((recProdiNama && p.nama === recProdiNama) || (rec?.prodiId && p.id === rec.prodiId))
                        );
                        if (!matchingProdi) return null;

                        const isShortlisted = shortlist.includes(matchingProdi.id);

                        return (
                          <div
                            key={ptnOpt.ptnId}
                            className={`p-3 rounded-2xl border text-xs flex items-center justify-between transition ${
                              isShortlisted
                                ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                                : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">
                                {ptnOpt.ptnNama}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                <span>Akred: {ptnOpt.akreditasiProdi}</span>
                                <span>•</span>
                                <span>SNBT: {ptnOpt.dayaTampungSNBT} Kursi</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (isShortlisted) {
                                  removeFromShortlist(matchingProdi.id);
                                } else {
                                  addToShortlist(matchingProdi.id);
                                }
                              }}
                              className={`p-2 rounded-xl transition cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center ${
                                isShortlisted
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  : 'bg-white dark:bg-slate-800 hover:bg-brand-500 hover:text-white text-brand-600 dark:text-blue-300 border border-slate-300 dark:border-slate-600 hover:border-brand-500'
                              }`}
                              title={isShortlisted ? 'Hapus dari Shortlist' : 'Tambah ke Shortlist'}
                            >
                              {isShortlisted ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Plus className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ); })()}

      {/* CONTENT MODE B: CATALOG SEARCH & FILTER */}
      {activeMode === 'catalog' && (
        <div className="space-y-6">
          {/* Search and Filters Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-colors duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama prodi atau kampus (UI, UGM, TI)..."
                  className="w-full pl-9 pr-3 py-2.5 text-base sm:text-xs min-h-[44px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* PTN Filter */}
              <div>
                <select
                  value={selectedPtn}
                  onChange={(e) => setSelectedPtn(e.target.value)}
                  className="w-full py-2.5 px-3 text-base sm:text-xs min-h-[44px] border border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="all" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    Semua PTN (10 Kampus MVP)
                  </option>
                  {ptnList.map((ptn) => (
                    <option key={ptn.id} value={ptn.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                      {ptn.singkatan} - {ptn.nama}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rumpun Filter */}
              <div>
                <select
                  value={selectedRumpun}
                  onChange={(e) => setSelectedRumpun(e.target.value)}
                  className="w-full py-2.5 px-3 text-base sm:text-xs min-h-[44px] border border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="all" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Semua Rumpun Ilmu</option>
                  <option value="Saintek" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Saintek (Sains & Teknologi)</option>
                  <option value="Soshum" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Soshum (Sosial & Humaniora)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Prodi Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProdis.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Tidak ada program studi yang cocok</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Coba ubah kata kunci atau reset filter pencarian</p>
              </div>
            ) : (
              filteredProdis.map((prodi) => {
                const ptn = ptnList.find((p) => p.id === prodi.ptnId);
                const isShortlisted = shortlist.includes(prodi.id);

                return (
                  <div
                    key={prodi.id}
                    className={`bg-white dark:bg-slate-900 rounded-3xl border p-5 transition flex flex-col justify-between ${
                      isShortlisted
                        ? 'border-emerald-400 dark:border-emerald-700 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-brand-600 dark:text-blue-300 bg-brand-50 dark:bg-blue-950/70 px-2.5 py-0.5 rounded-full border border-brand-100 dark:border-blue-900">
                          {ptn?.singkatan} • {ptn?.provinsi}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              prodi.rumpun === 'Saintek'
                                ? 'bg-brand-50 text-brand-600 dark:bg-blue-950/60 dark:text-blue-300'
                                : 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                            }`}
                          >
                            {prodi.rumpun}
                          </span>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-semibold border border-slate-200 dark:border-slate-700">
                            Akred: {prodi.akreditasi}
                          </span>
                        </div>
                      </div>

                      {/* Prodi Title */}
                      <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                        {prodi?.nama || (prodi as any)?.prodiNama || (prodi as any)?.nama_prodi || ''}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                        {prodi.deskripsi}
                      </p>

                      {/* Quota & Benchmark stats */}
                      <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-[11px] mb-3">
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Daya Tampung SNBT</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {prodi.dayaTampungSNBT} Kursi{' '}
                            <span className="text-slate-400 dark:text-slate-500 font-normal">
                              ({prodi.peminatTahunLaluSNBT} Peminat)
                            </span>
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Acuan Skor UTBK</span>
                          {prodi.acuanSkorUTBK?.status === 'belum_ada_acuan' ? (
                            <span className="font-semibold text-slate-400 dark:text-slate-500 italic">Belum Ada Acuan</span>
                          ) : (
                            <span className="font-bold text-brand-600 dark:text-blue-400 font-mono">
                              {prodi.acuanSkorUTBK?.rendah} - {prodi.acuanSkorUTBK?.tinggi}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Mapel Pendukung */}
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-4">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Mapel Pendukung: </span>
                        <span>{prodi.mapelPendukung.join(', ')}</span>
                      </div>
                    </div>

                    {/* Add to Shortlist Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isShortlisted) {
                          removeFromShortlist(prodi.id);
                        } else {
                          addToShortlist(prodi.id);
                        }
                      }}
                      className={`w-full py-3 px-4 min-h-[44px] rounded-2xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99] ${
                        isShortlisted
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-brand-50 dark:bg-blue-950/60 hover:bg-brand-500 dark:hover:bg-brand-500 text-brand-600 dark:text-blue-300 hover:text-white border border-blue-200 dark:border-blue-900 hover:border-brand-500'
                      }`}
                    >
                      {isShortlisted ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Sudah Ada di Shortlist Target</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Tambah ke Target Shortlist (Maks 4)</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Shortlist bar — sticky di mobile; inline mengikuti konten di desktop */}
      <div
        className="fixed bottom-0 inset-x-0 lg:static lg:border-0 lg:shadow-none lg:bg-transparent lg:backdrop-blur-none lg:mt-6 lg:px-0 bg-[color-mix(in_srgb,var(--color-cream-card)_94%,transparent)] backdrop-blur-md border-t border-[color-mix(in_srgb,var(--color-stroke)_14%,transparent)] pt-3 px-4 z-30 shadow-xl transition-colors duration-200"
        style={{ paddingBottom: 'calc(0.75rem + var(--safe-bottom))' }}
      >
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0 no-scrollbar">
            <span className="text-xs font-bold text-[var(--color-ink)] whitespace-nowrap">
              Target Shortlist ({shortlist.length}/4):
            </span>
            {shortlist.length === 0 ? (
              <span className="text-xs text-[color-mix(in_srgb,var(--color-ink)_50%,transparent)] italic">Belum ada prodi yang dipilih</span>
            ) : (
              shortlist.map((id) => {
                const p = prodiList.find((item) => item.id === id);
                const ptn = p ? ptnList.find((item) => item.id === p.ptnId) : null;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-900 whitespace-nowrap"
                  >
                    <span>{ptn?.singkatan || ''} • {p?.nama || (p as any)?.prodiNama || (p as any)?.nama_prodi || ''}</span>
                    <button
                      type="button"
                      onClick={() => removeFromShortlist(id)}
                      className="text-blue-400 hover:text-rose-600 dark:hover:text-rose-400 text-sm font-bold ml-0.5 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                );
              })
            )}
          </div>

          <Button
            variant="primary"
            brutal
            size="md"
            disabled={shortlist.length === 0}
            onClick={handleNextStep}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto shrink-0"
          >
            Lanjut ke Analisis ({shortlist.length} Prodi)
          </Button>
        </div>
      </div>
    </div>
  );
};
