import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  Compass,
  Trash2,
  ChevronDown,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { DEV_TOOLS } from "../lib/env";

export const Header: React.FC = () => {
  const {
    session,
    deleteGuestSession,
    loadPersona,
    activePersonaId,
    setCurrentStep,
    shortlist,
  } = useApp();

  const [isPersonaOpen, setIsPersonaOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[color-mix(in_srgb,var(--color-cream)_90%,transparent)] backdrop-blur-md border-b border-[color-mix(in_srgb,var(--color-stroke)_14%,transparent)] transition-colors duration-200">
        <div className="w-full px-4">
          <div className="flex items-center justify-between h-16 gap-2">
            {/* Left: Brand Logo & Tagline */}
            <div
              className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none shrink-0"
              onClick={() => setCurrentStep(session ? 2 : 1)}
            >
              <img
                src="/logo.png"
                alt="JalurKu Logo"
                className="w-10 h-10 rounded-full object-contain shadow-xs border border-slate-900/10 dark:border-slate-100/20"
              />
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-brand-600 dark:text-brand-200">
                    JalurKu
                  </span>
                  <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200 rounded-full border border-brand-200 dark:border-brand-500/30">
                    <ShieldCheck className="w-3 h-3" />
                    Decision Support SNBP/SNBT
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-[color-mix(in_srgb,var(--color-ink)_60%,transparent)] hidden lg:block leading-tight">
                  Sistem Analisis Kelayakan & Strategi Pilihan Berbasis Regulasi
                  Resmi
                </p>
              </div>
            </div>

            {/* Right: Controls & Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Persona Demo Dropdown — DEV ONLY (hilang di production) */}
              {DEV_TOOLS && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsPersonaOpen(!isPersonaOpen)}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 min-h-[40px] bg-brand-50 hover:bg-brand-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-brand-700 dark:text-brand-200 border border-brand-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition shadow-2xs active:scale-95"
                    title="Pilih Persona Demo Otomatis"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Persona</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${isPersonaOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isPersonaOpen && (
                    <div
                      className="absolute right-0 mt-2 w-72 sm:w-96 bg-[var(--color-cream-card)] rounded-2xl shadow-xl border border-[color-mix(in_srgb,var(--color-ink)_12%,transparent)] p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                      onMouseLeave={() => setIsPersonaOpen(false)}
                    >
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                          Skenario Pengujian PRD (1-Klik)
                        </p>
                        <p className="text-[11px] text-[color-mix(in_srgb,var(--color-ink)_60%,transparent)]">
                          Isi profil dan target seketika untuk demonstrasi alur
                          tanpa perlu mengetik ulang
                        </p>
                      </div>

                      {/* Skenario A */}
                      <button
                        type="button"
                        onClick={() => {
                          loadPersona("skenario_a");
                          setIsPersonaOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition border ${
                          activePersonaId === "skenario_a"
                            ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40"
                            : "border-transparent"
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
                        <p className="text-[11px] text-[color-mix(in_srgb,var(--color-ink)_65%,transparent)] leading-tight">
                          Lulusan 2026, SMAN A (DKI), Rapor 88,5, Minat Koding.
                          Langsung buka eksplorasi top 5 rekomendasi.
                        </p>
                      </button>

                      {/* Skenario B */}
                      <button
                        type="button"
                        onClick={() => {
                          loadPersona("skenario_b");
                          setIsPersonaOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition border mt-1 ${
                          activePersonaId === "skenario_b"
                            ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40"
                            : "border-transparent"
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
                        <p className="text-[11px] text-[color-mix(in_srgb,var(--color-ink)_65%,transparent)] leading-tight">
                          Lulusan 2026, SMAN A (Jabar). Target: UI TI, ITB TI,
                          UGM Ilkom. Langsung evaluasi Gate & Reach/Match/Safe.
                        </p>
                      </button>

                      {/* Skenario Tepi */}
                      <button
                        type="button"
                        onClick={() => {
                          loadPersona("skenario_tepi");
                          setIsPersonaOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition border mt-1 ${
                          activePersonaId === "skenario_tepi"
                            ? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/40"
                            : "border-transparent"
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
                        <p className="text-[11px] text-[color-mix(in_srgb,var(--color-ink)_65%,transparent)] leading-tight">
                          Lulusan 2022 (&gt;3 tahun batas SNBT). Bukti aturan
                          mutlak: otomatis gugur Gate & peluang tidak dihitung!
                        </p>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Theme Toggle Component (Light / Dark / System) */}
              <ThemeToggle />

              {/* Shortlist Badge (if items selected) */}
              {session && shortlist.length > 0 && (
                <span className="hidden xl:inline-flex text-xs bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200 font-semibold px-2.5 py-1 rounded-full border border-brand-200 dark:border-brand-500/30 tabular-nums">
                  {shortlist.length}/4 Target
                </span>
              )}

              {/* Delete Session Button — "Hapus Data Saya" (UU PDP), selalu terlihat */}
              {session && (
                <button
                  type="button"
                  onClick={deleteGuestSession}
                  className="flex items-center gap-1 px-2.5 sm:px-3 min-h-[40px] text-xs font-semibold text-danger bg-danger/10 hover:bg-danger/20 border border-danger/30 rounded-xl transition active:scale-95"
                  title="Hapus seluruh data sesi dan riwayat lokal (UU PDP)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Hapus Data</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
