import React, { useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Shield,
  User,
  Compass,
  CheckCircle,
  Sliders,
  FileText,
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

  const pct = Math.round((currentStep / steps.length) * 100);

  return (
    <div className="w-full bg-[color-mix(in_srgb,var(--color-cream)_92%,transparent)] backdrop-blur-md border-b border-[color-mix(in_srgb,var(--color-stroke)_14%,transparent)] py-2.5 transition-colors duration-200 sticky top-16 z-30">
      <div className="w-full px-4">
        {/* Progress tipis + label langkah (gaya mobile app, design.md §6) */}
        <div>
          <div className="flex items-center justify-between mb-1.5 gap-3">
            <span className="text-[11px] font-semibold text-[color-mix(in_srgb,var(--color-ink)_55%,transparent)] uppercase tracking-wider shrink-0 tabular-nums">
              Langkah {currentStep} dari 6
            </span>
            <span className="text-xs font-bold text-brand-600 truncate text-right">
              {steps[currentStep - 1].title}
            </span>
          </div>

          {/* Single continuous progress bar */}
          <div
            className="w-full bg-[var(--color-cream-sunk)] rounded-full h-2 overflow-hidden mb-2.5 border border-[color-mix(in_srgb,var(--color-stroke)_12%,transparent)]"
            role="progressbar"
            aria-valuenow={currentStep}
            aria-valuemin={1}
            aria-valuemax={steps.length}
            aria-label={`Langkah ${currentStep} dari ${steps.length}`}
          >
            <div
              className="h-full rounded-full bg-brand-500 transition-[width] duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ width: `${pct}%` }}
            />
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
                  className={`flex items-center gap-1.5 px-3 min-h-[36px] rounded-full text-xs font-semibold whitespace-nowrap shrink-0 snap-center transition-all ${
                    isCurrent
                      ? 'bg-brand-500 text-white shadow-soft'
                      : isPast
                      ? 'bg-safe/10 text-safe border border-safe/30'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700/80'
                  } ${!isAccessible ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                >
                  {isPast ? <CheckCircle className="w-3.5 h-3.5 shrink-0" /> : <Icon className="w-3.5 h-3.5 shrink-0" />}
                  <span>{s.number}. {s.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
