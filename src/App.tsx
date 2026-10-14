import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Stepper } from './components/Stepper';
import { AIDrawer } from './components/AIDrawer';
import { Step1Session } from './components/steps/Step1Session';
import { Step2Profile } from './components/steps/Step2Profile';
import { Step3Explore } from './components/steps/Step3Explore';
import { Step4Analyze } from './components/steps/Step4Analyze';
import { Step5Strategy } from './components/steps/Step5Strategy';
import { Step6Summary } from './components/steps/Step6Summary';
import { ShieldCheck, X } from 'lucide-react';

const MainContent: React.FC = () => {
  const { currentStep, toastMessage, clearToast } = useApp();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 max-w-sm sm:max-w-md bg-slate-900 dark:bg-slate-800 text-white text-xs px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 dark:border-slate-600 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
            <span className="leading-snug">{toastMessage}</span>
          </div>
          <button
            onClick={clearToast}
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            title="Tutup Notifikasi"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sticky Top Header */}
      <Header />

      {/* Stepper Navigation */}
      <Stepper />

      {/* Main Step Body with generous breathing space from sticky Header + Stepper */}
      <main className="flex-1 pt-8 md:pt-12 px-4 sm:px-6 lg:px-8 pb-28">
        {currentStep === 1 && <Step1Session />}
        {currentStep === 2 && <Step2Profile />}
        {currentStep === 3 && <Step3Explore />}
        {currentStep === 4 && <Step4Analyze />}
        {currentStep === 5 && <Step5Strategy />}
        {currentStep === 6 && <Step6Summary />}
      </main>

      {/* Contextual AI Drawer & Floating Action Button */}
      <AIDrawer />

      {/* Footer */}
      <footer className="no-print bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 px-4 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              <strong className="text-slate-800 dark:text-slate-200">JalurKu</strong> © 2026 • Platform Decision Support Pemilihan Jurusan & Strategi SNBP/SNBT
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500">
            <span>Sesuai Regulasi Kemendikbudristek & UU PDP</span>
            <span>•</span>
            <span>Didesain untuk Siswa SMA Kelas 12</span>
          </div>
        </div>
      </footer>
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
