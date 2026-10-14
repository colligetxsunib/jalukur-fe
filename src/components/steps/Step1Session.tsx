import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Compass,
  ArrowRight,
  Sliders,
  CheckCircle2,
  Sparkles,
  Users,
  Target,
} from 'lucide-react';

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

  return (
    <div className="max-w-5xl mx-auto py-4 sm:py-8 px-4 sm:px-6">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-10 pt-2 sm:pt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-5 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Platform Decision Support Resmi untuk Siswa SMA Kelas 12</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight sm:leading-tight mb-4">
          Bukan Sekadar Chatbot, Ini{' '}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 dark:from-blue-400 dark:via-indigo-300 dark:to-sky-300 bg-clip-text text-transparent">
            Decision Support
          </span>{' '}
          Strategi SNBP & SNBT Anda
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
          Hindari tebak-tebakan semu. Dapatkan analisis kelayakan deterministik berdasarkan regulasi mutlak
          (Gate), data acuan empiris siklus sebelumnya, dan simulator skenario What-If real-time.
        </p>
      </div>

      {/* Feature 4-Pillar Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md transition">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
            <Compass className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Rekomendasi Minat & Rapor</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Formula deterministik 50% kecocokan minat + 50% kesesuaian nilai mata pelajaran pendukung.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md transition">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Pengecekan Syarat Gate</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Filter mutlak tahun kelulusan dan legalitas kuota sekolah sebelum menghitung kategori peluang.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md transition">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Penilaian Safe/Match/Reach</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Pemetaan empiris skor UTBK terhadap sebaran nilai acuan, tanpa klaim persentase kelulusan semu.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md transition">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
            <Sliders className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Simulator What-If Interaktif</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Uji kenaikan skor tryout secara real-time dan evaluasi keseimbangan 4 pilihan prodi Anda.
          </p>
        </div>
      </div>

      {/* Main Consent & Start Guest Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg p-6 sm:p-8 max-w-2xl mx-auto mb-12 transition-colors duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-2xl border border-blue-100 dark:border-blue-900">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Mulai Sesi Tamu Terenkripsi</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sesuai dengan ketentuan Undang-Undang Perlindungan Data Pribadi (UU PDP)
            </p>
          </div>
        </div>

        {/* Privacy Consent Box (Fixed styling for dark mode readability) */}
        <div className="bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 mb-6 transition-colors duration-200">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-1 w-5 h-5 min-w-[20px] text-blue-600 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong className="font-semibold text-slate-900 dark:text-white block mb-0.5">
                Persetujuan Eksplisit Sesi Tamu (UU PDP):
              </strong>
              "Saya menyetujui penggunaan data profil akademik secara anonim untuk simulasi sesi ini (data
              tidak menyertakan identitas sensitif seperti nama lengkap/NIK dan otomatis terhapus dalam 24 jam
              atau saat tombol <em>Hapus Data</em> diklik)."
            </span>
          </label>
        </div>

        {/* Start Button */}
        {session ? (
          <div className="space-y-3">
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-2xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Sesi tamu aktif (Token terdaftar). Anda dapat langsung melanjutkan ke pengisian profil.</span>
            </div>
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="w-full py-3.5 min-h-[48px] bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <span>Lanjut ke Langkah 2: Profil & Minat</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={!consentChecked || isSubmitting}
            onClick={handleStartSession}
            className="w-full py-3.5 min-h-[48px] bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <span>{isSubmitting ? 'Memulai Sesi...' : 'Mulai Sesi Tamu Sekarang'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Test Demo Scenarios */}
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-4 justify-center">
          <Users className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Atau Uji Coba Cepat dengan Persona Demo (1-Klik)
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => loadPersona('skenario_a')}
            className="p-4 bg-white dark:bg-slate-800/90 hover:bg-blue-50/40 dark:hover:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-blue-600 text-left transition group shadow-2xs cursor-pointer active:scale-[0.99]"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                Skenario A: Rani
              </span>
              <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-semibold">
                Eksplorasi
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Belum punya target. Rapor 88,5, minat koding & sains. Menguji fitur Top 5 rekomendasi.
            </p>
          </button>

          <button
            type="button"
            onClick={() => loadPersona('skenario_b')}
            className="p-4 bg-white dark:bg-slate-800/90 hover:bg-blue-50/40 dark:hover:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-blue-600 text-left transition group shadow-2xs cursor-pointer active:scale-[0.99]"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                Skenario B: Dimas
              </span>
              <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-semibold">
                Target 3 Prodi
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Sudah punya target: UI TI, ITB TI, UGM Ilkom. UTBK 620. Menguji analisis Gate & What-If.
            </p>
          </button>

          <button
            type="button"
            onClick={() => loadPersona('skenario_tepi')}
            className="p-4 bg-white dark:bg-slate-800/90 hover:bg-rose-50/40 dark:hover:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/80 hover:border-rose-300 dark:hover:border-rose-600 text-left transition group shadow-2xs cursor-pointer active:scale-[0.99]"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-rose-900 dark:text-rose-300 group-hover:text-rose-700">
                Skenario Tepi
              </span>
              <span className="text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full font-semibold">
                Gugur Gate
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Lulusan 2022 (&gt;3 tahun). Menguji ketahanan sistem mutlak: otomatis gugur pada Gate SNBT.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
