import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Compass,
  Database,
  Trash2,
  ChevronDown,
  UserCheck,
  Settings,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { ApiConfigModal } from './modals/ApiConfigModal';
import { ThemeToggle } from './ThemeToggle';

export const Header: React.FC = () => {
  const {
    session,
    deleteGuestSession,
    apiMode,
    loadPersona,
    activePersonaId,
    setCurrentStep,
    shortlist,
  } = useApp();

  const [isPersonaOpen, setIsPersonaOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2">
            {/* Left: Brand Logo & Tagline */}
            <div
              className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none shrink-0"
              onClick={() => setCurrentStep(session ? 2 : 1)}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 dark:shadow-indigo-950/40">
                <Compass className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-700 via-blue-600 to-indigo-600 dark:from-indigo-400 dark:via-blue-300 dark:to-indigo-300 bg-clip-text text-transparent">
                    JalurKu
                  </span>
                  <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-800">
                    <ShieldCheck className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    Decision Support SNBP/SNBT
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 hidden lg:block leading-tight">
                  Sistem Analisis Kelayakan & Strategi Pilihan Berbasis Regulasi Resmi
                </p>
              </div>
            </div>

            {/* Right: Controls & Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* API Mode Indicator & Settings Button */}
              <button
                type="button"
                onClick={() => setIsConfigOpen(true)}
                className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition ${
                  apiMode === 'live'
                    ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-300'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300'
                }`}
                title="Buka Pengaturan API & Server"
              >
                <Database className="w-3.5 h-3.5" />
                <span>{apiMode === 'live' ? 'Live REST' : 'Smart Fallback'}</span>
                <Settings className="w-3 h-3 opacity-60 ml-0.5" />
              </button>

              {/* Persona Demo Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsPersonaOpen(!isPersonaOpen)}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 min-h-[40px] bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 dark:from-slate-800 dark:to-slate-800/90 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition shadow-2xs"
                  title="Pilih Persona Demo Otomatis"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="hidden xs:inline">Persona</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isPersonaOpen ? 'rotate-180' : ''}`} />
                </button>

                {isPersonaOpen && (
                  <div
                    className="absolute right-0 mt-2 w-72 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                    onMouseLeave={() => setIsPersonaOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Skenario Pengujian PRD (1-Klik)
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Isi profil dan target seketika untuk demonstrasi alur tanpa perlu mengetik ulang
                      </p>
                    </div>

                    {/* Skenario A */}
                    <button
                      type="button"
                      onClick={() => {
                        loadPersona('skenario_a');
                        setIsPersonaOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition border ${
                        activePersonaId === 'skenario_a'
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40'
                          : 'border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-indigo-900 dark:text-indigo-200">
                          Skenario A: Rani (Belum Punya Target)
                        </span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-1.5 py-0.5 rounded font-medium">
                          Eksplorasi
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                        Lulusan 2026, SMAN A (DKI), Rapor 88,5, Minat Koding. Langsung buka eksplorasi top 5 rekomendasi.
                      </p>
                    </button>

                    {/* Skenario B */}
                    <button
                      type="button"
                      onClick={() => {
                        loadPersona('skenario_b');
                        setIsPersonaOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition border mt-1 ${
                        activePersonaId === 'skenario_b'
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40'
                          : 'border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-indigo-900 dark:text-indigo-200">
                          Skenario B: Dimas (Sudah Punya Target)
                        </span>
                        <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium">
                          UTBK 620
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                        Lulusan 2026, SMAN A (Jabar). Target: UI TI, ITB TI, UGM Ilkom. Langsung evaluasi Gate & Reach/Match/Safe.
                      </p>
                    </button>

                    {/* Skenario Tepi */}
                    <button
                      type="button"
                      onClick={() => {
                        loadPersona('skenario_tepi');
                        setIsPersonaOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition border mt-1 ${
                        activePersonaId === 'skenario_tepi'
                          ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/40'
                          : 'border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-rose-800 dark:text-rose-300 flex items-center gap-1">
                          Skenario Tepi: Kasus Gugur Gate
                        </span>
                        <span className="text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 px-1.5 py-0.5 rounded font-medium">
                          Lulus 2022
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                        Lulusan 2022 (&gt;3 tahun batas SNBT). Bukti aturan mutlak: otomatis gugur Gate & peluang tidak dihitung!
                      </p>
                    </button>
                  </div>
                )}
              </div>

              {/* Theme Toggle Component (Light / Dark / System) */}
              <ThemeToggle />

              {/* Shortlist Badge (if items selected) */}
              {session && shortlist.length > 0 && (
                <span className="hidden xl:inline-flex text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-semibold px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                  {shortlist.length}/4 Target
                </span>
              )}

              {/* Red Delete Session Button */}
              {session && (
                <button
                  type="button"
                  onClick={deleteGuestSession}
                  className="flex items-center gap-1 px-2.5 sm:px-3 py-2 sm:py-1.5 min-h-[40px] text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/70 rounded-xl transition"
                  title="Hapus seluruh data sesi dan riwayat lokal (UU PDP)"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span className="hidden sm:inline">Hapus Data</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* API Config Modal */}
      <ApiConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
    </>
  );
};
