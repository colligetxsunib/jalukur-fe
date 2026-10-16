import React from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AppProvider, useApp } from "./context/AppContext";
import { Header } from "./components/Header";
import { Stepper } from "./components/Stepper";
import { AIDrawer } from "./components/AIDrawer";
import { Step1Session } from "./components/steps/Step1Session";
import { Step2Profile } from "./components/steps/Step2Profile";
import { Step3Explore } from "./components/steps/Step3Explore";
import { Step4Analyze } from "./components/steps/Step4Analyze";
import { Step5Strategy } from "./components/steps/Step5Strategy";
import { Step6Summary } from "./components/steps/Step6Summary";
import { ShieldCheck, X } from "lucide-react";

const MainContent: React.FC = () => {
  const { currentStep, toastMessage, clearToast } = useApp();

  return (
    // Latar luar: cream polos di mobile maupun desktop. Di desktop konten memakai
    // lebar layar (fullscreen, bukan device mockup) agar tidak jadi kolom sempit di tengah.
    <div className="min-h-[100dvh] w-full bg-[var(--color-cream)] text-[var(--color-ink)] font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 inset-x-4 sm:inset-x-auto sm:right-6 z-[60] sm:max-w-md bg-[var(--color-ink)] text-[var(--color-cream)] text-xs px-4 py-3 rounded-2xl shadow-2xl border-2 border-[var(--color-stroke)] flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber shrink-0 animate-pulse" />
            <span className="leading-snug">{toastMessage}</span>
          </div>
          <button
            onClick={clearToast}
            className="text-[color-mix(in_srgb,var(--color-cream)_70%,transparent)] hover:text-[var(--color-cream)] p-1 rounded-lg cursor-pointer"
            title="Tutup Notifikasi"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* APP FRAME — satu kolom konsisten (header+stepper+konten+footer sejajar).
          Mobile: full-width. Desktop (lg): memakai lebar layar (fullscreen), dibatasi
          max-w agar baris teks tetap nyaman dibaca di monitor sangat lebar. */}
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[560px] flex-col lg:max-w-[1280px]">
        <Header />
        <Stepper />

        <main className="flex-1 pt-5 px-4 pb-28 lg:px-8 lg:pb-8">
          {currentStep === 1 && <Step1Session />}
          {currentStep === 2 && <Step2Profile />}
          {currentStep === 3 && <Step3Explore />}
          {currentStep === 4 && <Step4Analyze />}
          {currentStep === 5 && <Step5Strategy />}
          {currentStep === 6 && <Step6Summary />}
        </main>

        <footer className="no-print px-4 py-6 text-[11px] text-[color-mix(in_srgb,var(--color-ink)_55%,transparent)] text-center leading-relaxed">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-500 shrink-0" />
            <strong className="text-[var(--color-ink)]">JalurKu</strong>
            <span>© 2026</span>
          </div>
          <span>
            Sesuai Regulasi Kemendikbudristek &amp; UU PDP · untuk Siswa SMA
            Kelas 12
          </span>
        </footer>
      </div>

      {/* Contextual AI Drawer & Floating Action Button */}
      <AIDrawer />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </ThemeProvider>
  );
}
