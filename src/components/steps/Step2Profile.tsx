import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PROVINCES_INDONESIA } from '../../data/catalog';
import { AkreditasiSekolah, NilaiTren, StudentProfile } from '../../types';
import {
  GraduationCap,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Brain,
  SlidersHorizontal,
  Tag,
} from 'lucide-react';
import { calculateRaporAverage } from '../../services/engine';

export const Step2Profile: React.FC = () => {
  const { profile, saveFullProfile, setCurrentStep, showToast } = useApp();

  const [form, setForm] = useState<StudentProfile>(profile);
  const [interestTab, setInterestTab] = useState<'quiz' | 'story'>('quiz');
  const [isExtractingTags, setIsExtractingTags] = useState(false);

  // Sync state if context profile changes (e.g. from loading persona)
  React.useEffect(() => {
    setForm(profile);
  }, [profile]);

  const handleRaporChange = (subject: keyof StudentProfile['nilaiRapor'], val: string) => {
    const num = val === '' ? 0 : Math.min(100, Math.max(0, parseFloat(val) || 0));
    setForm((prev) => ({
      ...prev,
      nilaiRapor: {
        ...prev.nilaiRapor,
        [subject]: num,
      },
    }));
  };

  const handleInterestScoreChange = (
    key: keyof StudentProfile['interestScores'],
    val: number
  ) => {
    setForm((prev) => ({
      ...prev,
      interestScores: {
        ...prev.interestScores,
        [key]: val,
      },
    }));
  };

  // AI Tag Extractor from free story
  const handleExtractTags = () => {
    if (!form.freeStoryText || form.freeStoryText.trim().length < 5) {
      showToast('Tuliskan setidaknya satu kalimat cerita minat Anda terlebih dahulu.');
      return;
    }
    setIsExtractingTags(true);

    setTimeout(() => {
      const text = form.freeStoryText!.toLowerCase();
      const extracted: string[] = [];

      if (text.includes('koding') || text.includes('web') || text.includes('software') || text.includes('komputer') || text.includes('program')) {
        extracted.push('#LogikaKomputasi', '#SoftwareDevelopment');
      }
      if (text.includes('logika') || text.includes('matematika') || text.includes('analisis') || text.includes('data')) {
        extracted.push('#ProblemSolving', '#DataAnalytics');
      }
      if (text.includes('desain') || text.includes('gambar') || text.includes('seni') || text.includes('kreatif') || text.includes('ui/ux')) {
        extracted.push('#DesainVisual', '#KreativitasMedia');
      }
      if (text.includes('dokter') || text.includes('medis') || text.includes('kesehatan') || text.includes('biologi') || text.includes('rumah sakit')) {
        extracted.push('#SainsKesehatan', '#Biomedis');
      }
      if (text.includes('bisnis') || text.includes('uang') || text.includes('jual') || text.includes('perusahaan') || text.includes('manajemen')) {
        extracted.push('#BisnisManajemen', '#Keuangan');
      }
      if (text.includes('hukum') || text.includes('politik') || text.includes('sosial') || text.includes('debat') || text.includes('masyarakat')) {
        extracted.push('#HukumSosial', '#Diplomasi');
      }
      if (text.includes('mesin') || text.includes('bangunan') || text.includes('robot') || text.includes('teknik') || text.includes('fisika')) {
        extracted.push('#RekayasaTeknik', '#Infrastruktur');
      }

      if (extracted.length === 0) {
        extracted.push('#EksplorasiAkademik', '#PengembanganDiri');
      }

      const mergedTags = Array.from(new Set([...(form.interestTags || []), ...extracted]));
      setForm((prev) => ({ ...prev, interestTags: mergedTags }));
      setIsExtractingTags(false);
      showToast(`${extracted.length} tag minat berhasil diekstrak oleh AI Parser!`);
    }, 400);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setForm((prev) => ({
      ...prev,
      interestTags: prev.interestTags.filter((t) => t !== tagToRemove),
    }));
  };

  // Missing data validation banner
  const missingDataFields: string[] = [];
  if (!form.tahunLulus) missingDataFields.push('Tahun Kelulusan');
  if (!form.provinsi) missingDataFields.push('Provinsi');
  if (!form.akreditasiSekolah) missingDataFields.push('Akreditasi Sekolah');
  if (!form.skorTryout || form.skorTryout <= 0) missingDataFields.push('Skor Tryout UTBK (Wajib untuk analisis SNBT)');
  if (calculateRaporAverage(form.nilaiRapor) === 0) missingDataFields.push('Nilai Rapor Semester 1-5');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveFullProfile(form);
    showToast('Profil akademik & preferensi minat berhasil disimpan.');
    setCurrentStep(3);
  };

  const raporAverage = calculateRaporAverage(form.nilaiRapor);

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Langkah 2: Profil Akademik & Eksplorasi Minat
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Lengkapi riwayat akademik dan kecenderungan minat Anda untuk evaluasi deterministik yang presisi.
        </p>
      </div>

      {/* Warning Banner if data_kurang */}
      {missingDataFields.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/60 rounded-3xl border border-amber-200 dark:border-amber-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            <strong className="font-semibold block mb-0.5">Perhatian: Status Data Belum Lengkap</strong>
            <span>
              Beberapa parameter penting belum terisi ({missingDataFields.join(', ')}). Sistem akan
              menandai status <span className="font-semibold text-amber-950 dark:text-amber-100">data_kurang</span> pada
              pemeriksaan Gate sampai Anda mengisinya.
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {/* Section 1: Data Pokok Sekolah & Kelulusan */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs transition-colors duration-200">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">1. Data Pokok Siswa & Sekolah</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tahun Lulus */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tahun Kelulusan <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.tahunLulus}
                onChange={(e) => setForm({ ...form, tahunLulus: parseInt(e.target.value) })}
                className="w-full text-base sm:text-xs p-2.5 min-h-[44px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              >
                <option value={2026} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  2026 (Angkatan Berjalan - Kelas 12)
                </option>
                <option value={2025} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  2025 (Gap Year 1 Tahun)
                </option>
                <option value={2024} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  2024 (Gap Year 2 Tahun)
                </option>
                <option value={2022} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  2022 (Uji Kasus Gugur Gate &gt; 3 Thn)
                </option>
              </select>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                SNBT memperbolehkan 2024-2026. SNBP hanya 2026.
              </p>
            </div>

            {/* Provinsi */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Provinsi Asal Sekolah <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.provinsi}
                onChange={(e) => setForm({ ...form, provinsi: e.target.value })}
                className="w-full text-base sm:text-xs p-2.5 min-h-[44px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              >
                {PROVINCES_INDONESIA.map((p) => (
                  <option key={p} value={p} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    {p}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Mempengaruhi analisis domisili PTN</p>
            </div>

            {/* Akreditasi Sekolah */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Akreditasi Sekolah <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.akreditasiSekolah}
                onChange={(e) =>
                  setForm({ ...form, akreditasiSekolah: e.target.value as AkreditasiSekolah })
                }
                className="w-full text-base sm:text-xs p-2.5 min-h-[44px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              >
                <option value="A" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  Akreditasi A (Kuota SNBP 40%)
                </option>
                <option value="B" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  Akreditasi B (Kuota SNBP 25%)
                </option>
                <option value="C" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  Akreditasi C (Kuota SNBP 5%)
                </option>
                <option value="Belum Terakreditasi" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  Belum Terakreditasi
                </option>
              </select>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Kunci kuota eligible di PDSS</p>
            </div>

            {/* Skor Tryout UTBK */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Skor Rerata Tryout UTBK
              </label>
              <input
                type="number"
                min={300}
                max={850}
                value={form.skorTryout || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    skorTryout: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="Misal: 620"
                className="w-full text-base sm:text-xs p-2.5 min-h-[44px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Rentang 300 - 850 (evaluasi SNBT)</p>
            </div>
          </div>
        </div>

        {/* Section 2: Nilai Rapor Semester 1-5 */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs transition-colors duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                2. Nilai Rapor Semester 1 - 5 (Skala 0 - 100)
              </h3>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-3.5 py-1.5 rounded-2xl text-xs font-semibold border border-blue-200 dark:border-blue-900 self-start sm:self-auto">
              <span>Rata-Rata Saat Ini:</span>
              <span className="text-sm font-bold font-mono">{raporAverage}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
            {[
              { key: 'matematika', label: 'Matematika' },
              { key: 'fisika', label: 'Fisika' },
              { key: 'kimia', label: 'Kimia' },
              { key: 'biologi', label: 'Biologi' },
              { key: 'ekonomi', label: 'Ekonomi' },
              { key: 'sosiologi', label: 'Sosiologi' },
              { key: 'geografi', label: 'Geografi' },
              { key: 'bahasaIndonesia', label: 'B. Indonesia' },
              { key: 'bahasaInggris', label: 'B. Inggris' },
            ].map(({ key, label }) => (
              <div key={key} className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 line-clamp-1">
                  {label}
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={form.nilaiRapor[key as keyof StudentProfile['nilaiRapor']] ?? ''}
                  onChange={(e) =>
                    handleRaporChange(key as keyof StudentProfile['nilaiRapor'], e.target.value)
                  }
                  className="w-full text-base sm:text-xs p-2 min-h-[40px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-center font-mono font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>

          {/* Tren Nilai & Peringkat Paralel */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tren Nilai Semester 1 - 5
              </label>
              <select
                value={form.trenNilai}
                onChange={(e) => setForm({ ...form, trenNilai: e.target.value as NilaiTren })}
                className="w-full text-base sm:text-xs p-2.5 min-h-[44px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              >
                <option value="Naik" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Konsisten Naik (Bobot Positif SNBP)</option>
                <option value="Stabil" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Stabil Rata-Rata</option>
                <option value="Turun" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Fluktuatif / Menurun</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Peringkat Paralel Kelas 12 (Opsional)
              </label>
              <input
                type="number"
                min={1}
                value={form.peringkatParalel || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    peringkatParalel: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="Misal: 15"
                className="w-full text-base sm:text-xs p-2.5 min-h-[44px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Total Siswa Se-Angkatan (Opsional)
              </label>
              <input
                type="number"
                min={10}
                value={form.totalSiswaAngkatan || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    totalSiswaAngkatan: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="Misal: 300"
                className="w-full text-base sm:text-xs p-2.5 min-h-[44px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Input Minat (2 Tab: Kuesioner Cepat vs Cerita Bebas) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs transition-colors duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">3. Pemetaan Preferensi & Minat</h3>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => setInterestTab('quiz')}
                className={`px-3 py-2 sm:py-1.5 min-h-[38px] rounded-xl text-xs font-semibold transition ${
                  interestTab === 'quiz'
                    ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 inline mr-1" />
                Tab 1: Kuesioner Cepat
              </button>
              <button
                type="button"
                onClick={() => setInterestTab('story')}
                className={`px-3 py-2 sm:py-1.5 min-h-[38px] rounded-xl text-xs font-semibold transition ${
                  interestTab === 'story'
                    ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 inline mr-1 text-blue-600 dark:text-blue-400" />
                Tab 2: Cerita Bebas (AI Parser)
              </button>
            </div>
          </div>

          {interestTab === 'quiz' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Beri penilaian seberapa besar ketertarikan Anda terhadap bidang-bidang berikut (1 = Sangat
                Rendah, 5 = Sangat Tertarik):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    key: 'logikaKoding',
                    title: 'Logika, Komputer & Koding',
                    desc: 'Problem solving, pemrograman, algoritma, kecerdasan buatan',
                  },
                  {
                    key: 'rekayasaFisika',
                    title: 'Rekayasa, Mesin & Fisika',
                    desc: 'Konstruksi bangunan, instalasi listrik, perancangan otomasi industri',
                  },
                  {
                    key: 'kesehatanBiologi',
                    title: 'Kesehatan & Biologi Medis',
                    desc: 'Fisiologi manusia, kedokteran, farmasi, penanganan klinis',
                  },
                  {
                    key: 'bisnisManajemen',
                    title: 'Bisnis, Manajemen & Finansial',
                    desc: 'Strategi pasar, pembukuan akuntansi, kepemimpinan organisasi',
                  },
                  {
                    key: 'desainKreatif',
                    title: 'Desain, Media & Kreatif',
                    desc: 'Desain visual, animasi, arsitektur tata ruang, storytelling komunikasi',
                  },
                  {
                    key: 'sosialHukum',
                    title: 'Sosial, Hukum & Humaniora',
                    desc: 'Peraturan hukum, diplomasi internasional, dinamika perilaku masyarakat',
                  },
                ].map(({ key, title, desc }) => (
                  <div
                    key={key}
                    className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
                  >
                    <div className="mb-3">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">{title}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{desc}</span>
                    </div>
                    <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-200/80 dark:border-slate-700/60">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() =>
                            handleInterestScoreChange(
                              key as keyof StudentProfile['interestScores'],
                              lvl
                            )
                          }
                          className={`flex-1 py-2 sm:py-1 min-h-[40px] rounded-xl text-xs font-bold transition ${
                            form.interestScores[key as keyof StudentProfile['interestScores']] ===
                            lvl
                              ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tuliskan Cerita Minat, Hobi & Cita-Cita Anda Secara Bebas:
                </label>
                <textarea
                  rows={4}
                  value={form.freeStoryText || ''}
                  onChange={(e) => setForm({ ...form, freeStoryText: e.target.value })}
                  placeholder="Contoh: Saya suka sekali ngulik koding web mandiri, memecahkan soal logika matematika yang menantang, dan bermimpi membuat startup teknologi yang membantu logistik di Indonesia..."
                  className="w-full text-base sm:text-xs p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleExtractTags}
                  disabled={isExtractingTags}
                  className="px-4 py-2.5 min-h-[44px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-2xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isExtractingTags ? 'Mengekstrak Tag...' : 'Ekstrak Tag Minat dengan AI'}</span>
                </button>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Menganalisis kata kunci minat otomatis</span>
              </div>
            </div>
          )}

          {/* Active Interest Tags Display */}
          {form.interestTags && form.interestTags.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-500" />
                Tag Minat Terstruktur Saat Ini:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {form.interestTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-semibold border border-blue-200 dark:border-blue-900"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-xs font-bold ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3.5 min-h-[48px] bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <span>Simpan Profil & Lanjut ke Target Prodi</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
