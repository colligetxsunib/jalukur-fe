import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { BentoCard, Button } from "../ui";
import { DEV_TOOLS } from "../../lib/env";
import {
  ShieldCheck,
  Compass,
  ArrowRight,
  Sliders,
  CheckCircle2,
  Sparkles,
  Target,
} from "lucide-react";

export const Step1Session: React.FC = () => {
  const { session, startGuestSession, setCurrentStep, loadPersona } = useApp();
  const [consentChecked, setConsentChecked] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartSession = async () => {
    if (!consentChecked) return;
    setIsSubmitting(true);
    const success = await startGuestSession(true);
    setIsSubmitting(false);
    if (success) {
      setCurrentStep(2);
    }
  };

  const pillars = [
    {
      icon: Compass,
      accent: "brand" as const,
      title: "Rekomendasi Minat & Rapor",
      desc: "50% kecocokan minat + 50% kesesuaian nilai mapel pendukung.",
    },
    {
      icon: ShieldCheck,
      accent: "safe" as const,
      title: "Pengecekan Syarat Gate",
      desc: "Filter mutlak tahun lulus & kuota sekolah sebelum hitung peluang.",
    },
    {
      icon: Target,
      accent: "match" as const,
      title: "Penilaian Safe/Match/Reach",
      desc: "Pemetaan skor UTBK ke sebaran acuan, tanpa persentase semu.",
    },
    {
      icon: Sliders,
      accent: "coral" as const,
      title: "Simulator What-If",
      desc: "Geser skor tryout real-time, evaluasi 4 pilihan prodi langsung.",
    },
  ];

  const personas = [
    {
      id: "skenario_a" as const,
      name: "Rani",
      tag: "Eksplorasi",
      tagClass:
        "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200",
      desc: "Belum punya target. Rapor 88,5, minat koding & sains.",
      accent: "brand" as const,
    },
    {
      id: "skenario_b" as const,
      name: "Dimas",
      tag: "Target 3 Prodi",
      tagClass: "bg-match/10 text-match border border-match/20",
      desc: "Target UI TI, ITB TI, UGM Ilkom. UTBK 620.",
      accent: "match" as const,
    },
    {
      id: "skenario_tepi" as const,
      name: "Kasus Tepi",
      tag: "Gugur Gate",
      tagClass: "bg-danger/10 text-danger border border-danger/20",
      desc: "Lulusan 2022 (>3 th). Uji sistem mutlak gugur Gate.",
      accent: "danger" as const,
    },
  ];

  return (
    <>
      {/* pb besar agar konten tak tertutup sticky CTA di bawah */}
      <div className="w-full pb-40 lg:pb-0">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-8 pt-2 sm:pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-500/15 border border-brand-200 dark:border-brand-500/30 text-brand-700 dark:text-brand-200 text-xs font-semibold mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Decision Support SNBP &amp; SNBT buat anak SMA</span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-4">
            Berhenti nebak-nebak.{" "}
            <span className="text-brand-600 dark:text-brand-200">
              Susun strategimu
            </span>{" "}
            dengan data.
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Bukan ramalan, bukan katanya. Peluangmu dihitung dari aturan resmi
            dan data nyata &mdash; dan kamu bisa utak-atik tiap pilihan sampai
            pas. Gratis, transparan, anonim.
          </p>
        </div>

        {/* 4-Pillar Bento Grid (2 kolom di mobile — thumb-friendly) */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {pillars.map((p) => {
            const Icon = p.icon;
            const iconColor = {
              brand:
                "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-200",
              safe: "bg-safe/10 text-safe",
              match: "bg-match/10 text-match",
              coral: "bg-accent-coral/10 text-accent-coral",
            }[p.accent];
            return (
              <BentoCard key={p.title} variant="feature" accent={p.accent}>
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${iconColor}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1 leading-tight">
                  {p.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {p.desc}
                </p>
              </BentoCard>
            );
          })}
        </div>

        {/* Consent — ringkas, 1 ketuk */}
        <BentoCard
          variant="feature"
          accent="brand"
          className="max-w-2xl mx-auto mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-brand-50 dark:bg-brand-500/20 text-brand-600 dark:text-brand-200 rounded-2xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Sesi Tamu Anonim
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tanpa daftar. Data terhapus otomatis dalam 24 jam (UU PDP).
              </p>
            </div>
          </div>
          <label className="flex items-start gap-3 cursor-pointer select-none bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-0.5 w-5 h-5 min-w-[20px] accent-brand-500 rounded cursor-pointer"
            />
            <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Aku setuju data profil akademikku dipakai anonim untuk simulasi
              sesi ini (tanpa nama/NIK), dan bisa kuhapus kapan saja lewat
              tombol <em>Hapus Data</em>.
            </span>
          </label>
        </BentoCard>

        {/* Persona demo — DEV ONLY (hilang di production) */}
        {DEV_TOOLS && (
          <div className="max-w-3xl mx-auto">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 text-center">
              Atau coba cepat pakai persona demo
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {personas.map((p) => (
                <BentoCard
                  key={p.id}
                  accent={p.accent}
                  onClick={() => loadPersona(p.id)}
                >
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {p.name}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${p.tagClass}`}
                    >
                      {p.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {p.desc}
                  </p>
                </BentoCard>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA — sticky-bottom di mobile (zona jempol); inline mengikuti konten di desktop */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[color-mix(in_srgb,var(--color-stroke)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-cream-card)_94%,transparent)] backdrop-blur-md lg:static lg:border-0 lg:bg-transparent lg:backdrop-blur-none lg:mt-6"
        style={{ paddingBottom: "calc(0.75rem + var(--safe-bottom))" }}
      >
        <div className="w-full px-4 pt-3 lg:px-0 lg:pt-0">
          {session ? (
            <>
              <div className="mb-2.5 flex items-center gap-2 text-xs text-safe">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Sesi tamu aktif. Lanjut isi profil kamu.</span>
              </div>
              <Button
                variant="primary"
                brutal
                block
                size="lg"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => setCurrentStep(2)}
              >
                Lanjut: Profil &amp; Minat
              </Button>
            </>
          ) : (
            <Button
              variant="volt"
              brutal
              block
              size="lg"
              loading={isSubmitting}
              loadingText="Memulai sesi…"
              disabled={!consentChecked}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={handleStartSession}
            >
              Mulai Sekarang
            </Button>
          )}
        </div>
      </div>
    </>
  );
};
