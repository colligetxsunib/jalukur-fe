import React, { useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Shield,
  User,
  Compass,
  CheckCircle,
  Sliders,
  FileText,
  ChevronRight,
} from 'lucide-react';

export const Stepper: React.FC = () => {
  const { currentStep, setCurrentStep, session } = useApp();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeStepRef = useRef<HTMLButtonElement>(null);

  const steps = [
    { number: 1, title: 'Sesi & Privasi', icon: Shield, desc: 'Consent UU PDP' },
    { number: 2, title: 'Profil & Minat', icon: User, desc: 'Rapor & Minat' },
    { number: 3, title: 'Target Prodi', icon: Compass, desc: 'Eksplorasi & Katalog' },
    { number: 4, title: 'Analisis Kelayakan', icon: CheckCircle, desc: 'Gate & Reach/Match' },
    { number: 5, title: 'Simulator What-If', icon: Sliders, desc: 'Optimasi Strategi' },
    { number: 6, title: 'Ringkasan Final', icon: FileText, desc: 'Cetak Dokumen' },
  ];

  // Auto-scroll active step into view on mobile
  useEffect(() => {
    if (activeStepRef.current && scrollContainerRef.current) {
      activeStepRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [currentStep]);

  return (
    <div className="w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 py-2.5 sm:py-3 shadow-2xs transition-colors duration-200 sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile View (< 1024px): Progress bar and smooth horizontal scroll chips */}
        <div className="block lg:hidden">
          <div className="flex items-center justify-between mb-1.5 px-1 sm:px-2 gap-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0">
              Langkah {currentStep} dari 6
            </span>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 truncate text-right">
              {steps[currentStep - 1].title}
            </span>
          </div>

          {/* Top thin progress bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden flex mb-2">
            {steps.map((s) => (
              <div
                key={s.number}
                className={`h-full flex-1 border-r border-white/40 dark:border-slate-900 transition-all duration-300 ${
                  s.number < currentStep
                    ? 'bg-emerald-500 dark:bg-emerald-400'
                    : s.number === currentStep
                    ? 'bg-blue-600 dark:bg-blue-500'
                    : 'bg-transparent'
                }`}
              />
            ))}
          </div>

          {/* Horizontal scroll chip bar */}
          <div
            ref={scrollContainerRef}
            className="flex items-center overflow-x-auto pb-1 gap-2 no-scrollbar snap-x touch-pan-x"
          >
            {steps.map((s) => {
              const Icon = s.icon;
              const isPast = s.number < currentStep;
              const isCurrent = s.number === currentStep;
              const isAccessible = session !== null || s.number === 1;

              return (
                <button
                  key={s.number}
                  ref={isCurrent ? activeStepRef : null}
                  disabled={!isAccessible}
                  onClick={() => isAccessible && setCurrentStep(s.number)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 snap-center transition-all ${
                    isCurrent
                      ? 'bg-blue-600 text-white dark:bg-blue-500 shadow-sm'
                      : isPast
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700/80'
                  } ${!isAccessible ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{s.number}. {s.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop View (>= 1024px): Full Horizontal Stepper */}
        <div className="hidden lg:flex items-center justify-between">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isPast = s.number < currentStep;
            const isCurrent = s.number === currentStep;
            const isAccessible = session !== null || s.number === 1;

            return (
              <React.Fragment key={s.number}>
                <button
                  type="button"
                  disabled={!isAccessible}
                  onClick={() => isAccessible && setCurrentStep(s.number)}
                  className={`flex items-center gap-3 text-left transition p-2 rounded-2xl group ${
                    !isAccessible
                      ? 'cursor-not-allowed opacity-50'
                      : 'cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition shadow-2xs ${
                      isCurrent
                        ? 'bg-blue-600 text-white dark:bg-blue-500 shadow-blue-500/25 ring-2 ring-blue-400/30'
                        : isPast
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                    }`}
                  >
                    {isPast ? <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <div>
                    <p
                      className={`text-xs font-bold leading-tight ${
                        isCurrent
                          ? 'text-blue-600 dark:text-blue-400'
                          : isPast
                          ? 'text-slate-800 dark:text-slate-200'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {s.number}. {s.title}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{s.desc}</p>
                  </div>
                </button>

                {idx < steps.length - 1 && (
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 mx-1 ${
                      s.number < currentStep
                        ? 'text-emerald-500 dark:text-emerald-400'
                        : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
