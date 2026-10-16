import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { findPtnById, getProdiOrFallback, PRODI_LIST, PTN_LIST } from '../../data/catalog';
import { assessTargetProdi, calculateRaporAverage } from '../../services/engine';
import { Button } from '../ui';
import { haptic, HAPTIC } from '../../lib/haptics';
import { prefersReducedMotion } from '../../lib/motion';
import {
  Printer,
  CheckSquare,
  AlertTriangle,
  ExternalLink,
  Target,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const Step6Summary: React.FC = () => {
  const { profile, strategyChoices, whatIfSkorTryout, setCurrentStep } = useApp();

  // Momen perayaan: confetti + haptic saat tiba di ringkasan final (hormati reduced-motion)
  useEffect(() => {
    if (prefersReducedMotion()) return;
    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      haptic(HAPTIC.success);
    } catch {}
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const raporAverage = calculateRaporAverage(profile.nilaiRapor);

  // Compute final assessed choices
  const assessedChoices = strategyChoices.map((choice) => {
    const prodi = getProdiOrFallback(choice.prodiId);
    const ptn = findPtnById(prodi.ptnId) || PTN_LIST.find((p) => p.id === prodi.ptnId);
    const assessment = assessTargetProdi(
      profile,
      prodi,
      choice.jalur,
      whatIfSkorTryout
    );

    return {
      choice,
      prodi,
      ptn,
      assessment,
    };
  });

  // Identify subjects or UTBK gap to boost
  const gapItems = assessedChoices.filter(
    (item) => item?.assessment.penilaian?.kategori === 'REACH'
  );

  return (
    <div className="w-full pb-32 lg:pb-0 print:p-0 print:m-0 print:max-w-none print:w-full">
      {/* Action Bar (Hidden during print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Ringkasan Strategi &amp; Dokumen Final
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Dokumen siap cetak/simpan PDF (1 halaman A4) sebagai panduan persiapanmu.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" onClick={() => setCurrentStep(5)}>
            Ubah Strategi
          </Button>
          <Button
            variant="primary"
            brutal
            size="md"
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={handlePrint}
          >
            Cetak / Simpan PDF
          </Button>
        </div>
      </div>

      {/* PRINTABLE REPORT DOCUMENT CONTAINER */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-sm print-card space-y-8 print:space-y-2.5 transition-colors duration-200">
        {/* Document Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-6 print:pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:gap-2">
          <div className="flex items-center gap-3 print:gap-2">
            <div className="w-12 h-12 print:w-8 print:h-8 rounded-2xl print:rounded-lg bg-brand-500 text-white flex items-center justify-center font-extrabold text-lg print:text-xs shadow-sm shrink-0">
              JK
            </div>
            <div>
              <h1 className="text-xl print:text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                JalurKu — Dokumen Strategi Pilihan SNBP & SNBT 2026
              </h1>
              <p className="text-xs print:text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                Laporan Hasil Analisis Kelayakan & Rekomendasi Persiapan Siswa
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right print:text-right text-[11px] print:text-[9px] text-slate-500 dark:text-slate-400 shrink-0">
            <span className="block font-semibold text-slate-700 dark:text-slate-300">Tanggal Dokumen:</span>
            <span>{new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>
          </div>
        </div>

        {/* Section 1: Profil Siswa & Minat */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 print:mb-1 print:text-[10px] flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 print:w-3.5 print:h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            1. Ringkasan Profil Akademik & Minat Siswa
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-3 sm:gap-4 print:gap-2 bg-slate-50 dark:bg-slate-800/60 p-4 print:p-2 rounded-2xl print:rounded-lg border border-slate-200 dark:border-slate-700/80 text-xs print:text-[9px]">
            <div className="min-w-0">
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] print:text-[8px]">Tahun Kelulusan</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{profile.tahunLulus}</span>
            </div>
            <div className="min-w-0">
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] print:text-[8px]">Asal Provinsi & Akreditasi</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 break-words">
                {profile.provinsi} (Akred: {profile.akreditasiSekolah})
              </span>
            </div>
            <div className="min-w-0">
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] print:text-[8px]">Rata-Rata Rapor Sem 1-5</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                {raporAverage} (Tren {profile.trenNilai})
              </span>
            </div>
            <div className="min-w-0">
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] print:text-[8px]">Skor Simulasi UTBK</span>
              <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                {whatIfSkorTryout ?? profile.skorTryout ?? 'Belum diisi'}
              </span>
            </div>
          </div>

          {/* Interest Tags */}
          {profile.interestTags && profile.interestTags.length > 0 && (
            <div className="mt-3 print:mt-1 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] print:text-[8.5px] font-semibold text-slate-600 dark:text-slate-400">Tag Minat Terpetakan:</span>
              {profile.interestTags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 print:px-1.5 print:py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded-xl print:rounded-md text-[11px] print:text-[8.5px] font-semibold border border-blue-200 dark:border-blue-900"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Tabel Konfigurasi Pilihan Program Studi */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 print:mb-1 print:text-[10px] flex items-center gap-1.5">
            <Target className="w-4 h-4 print:w-3.5 print:h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            2. Tabel Konfigurasi Pilihan Program Studi
          </h3>

          {/* Desktop & Print Table View */}
          <div className="hidden md:block print:block overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl print:rounded-lg no-scrollbar">
            <table className="w-full text-left text-xs min-w-[500px] print:min-w-0">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                <tr>
                  <th className="py-3 px-3 print:py-1 print:px-1.5 w-12 print:w-8 text-center print:text-[8.5px]">No</th>
                  <th className="py-3 px-3 print:py-1 print:px-1.5 print:text-[8.5px]">PTN & Program Studi</th>
                  <th className="py-3 px-3 print:py-1 print:px-1.5 print:text-[8.5px]">Jalur</th>
                  <th className="py-3 px-3 print:py-1 print:px-1.5 print:text-[8.5px]">Status Gate</th>
                  <th className="py-3 px-3 print:py-1 print:px-1.5 print:text-[8.5px]">Kategori Kelayakan</th>
                  <th className="py-3 px-3 print:py-1 print:px-1.5 print:text-[8.5px]">Ambang Acuan / GAP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {assessedChoices.map((item) => {
                  if (!item) return null;
                  const cat = item.assessment.penilaian?.kategori || 'BELUM_ADA_ACUAN';

                  return (
                    <tr key={item.choice.urutan} className="hover:bg-slate-50/60 dark:hover:bg-slate-800">
                      <td className="py-3 px-3 print:py-1 print:px-1.5 text-center font-bold text-blue-600 dark:text-blue-400 print:text-[8.5px]">
                        #{item.choice.urutan}
                      </td>
                      <td className="py-3 px-3 print:py-1 print:px-1.5">
                        <span className="font-bold text-slate-900 dark:text-white block print:text-[8.5px]">
                          {item.ptn?.singkatan || ''} — {item.prodi?.nama || (item.prodi as any)?.prodiNama || (item.prodi as any)?.nama_prodi || ''}
                        </span>
                        <span className="text-[10px] print:text-[7.5px] text-slate-500 dark:text-slate-400">
                          {item.prodi?.rumpun || ''} • Daya Tampung: {item.prodi?.dayaTampungSNBT ?? 0}
                        </span>
                      </td>
                      <td className="py-3 px-3 print:py-1 print:px-1.5">
                        <span className="px-2 py-0.5 print:px-1.5 print:py-0.2 bg-slate-100 dark:bg-slate-800 rounded text-[10px] print:text-[8px] font-bold text-slate-700 dark:text-slate-300">
                          {item.choice.jalur}
                        </span>
                      </td>
                      <td className="py-3 px-3 print:py-1 print:px-1.5">
                        <span
                          className={`px-2.5 py-0.5 print:px-1.5 print:py-0.2 rounded-full text-[10px] print:text-[8px] font-bold ${
                            item.assessment.gate.status === 'lolos'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
                          }`}
                        >
                          {item.assessment.gate.status === 'lolos' ? 'Lolos' : 'Gagal'}
                        </span>
                      </td>
                      <td className="py-3 px-3 print:py-1 print:px-1.5">
                        <span
                          className={`px-2.5 py-0.5 print:px-1.5 print:py-0.2 rounded-full text-[10px] print:text-[8px] font-bold font-mono ${
                            cat === 'SAFE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                              : cat === 'MATCH'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300'
                              : cat === 'REACH'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {(cat || '').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 print:py-1 print:px-1.5 font-mono text-[11px] print:text-[8px]">
                        {item.assessment.penilaian?.gap ? (
                          <span className="text-amber-700 dark:text-amber-400 font-bold">
                            GAP: -{item.assessment.penilaian.gap} Poin
                          </span>
                        ) : item.assessment.penilaian?.acuan ? (
                          <span className="text-slate-600 dark:text-slate-400">
                            {item.assessment.penilaian.acuan.rendah} -{' '}
                            {item.assessment.penilaian.acuan.tinggi}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic">Belum ada acuan</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Vertical Cards View (Hidden on Desktop & Print) */}
          <div className="block md:hidden print:hidden space-y-3">
            {assessedChoices.map((item) => {
              if (!item) return null;
              const cat = item.assessment.penilaian?.kategori || 'BELUM_ADA_ACUAN';

              return (
                <div
                  key={item.choice.urutan}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-xl bg-blue-600 dark:bg-blue-500 text-white font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        #{item.choice.urutan}
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                          {item.ptn?.singkatan || ''} — {item.prodi?.nama || (item.prodi as any)?.prodiNama || (item.prodi as any)?.nama_prodi || ''}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.prodi?.rumpun || ''} • Daya Tampung: {item.prodi?.dayaTampungSNBT ?? 0} Kursi
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px] font-bold text-slate-800 dark:text-slate-200 shrink-0">
                      {item.choice.jalur}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/80 text-center">
                    <div className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60">
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-semibold">Status Gate</span>
                      <span
                        className={`text-[10px] font-bold ${
                          item.assessment.gate.status === 'lolos'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {item.assessment.gate.status === 'lolos' ? '✓ Lolos' : '✕ Gagal'}
                      </span>
                    </div>

                    <div className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60">
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-semibold">Kategori</span>
                      <span
                        className={`text-[10px] font-bold font-mono ${
                          cat === 'SAFE'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : cat === 'MATCH'
                            ? 'text-blue-600 dark:text-blue-400'
                            : cat === 'REACH'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {(cat || '').replace('_', ' ')}
                      </span>
                    </div>

                    <div className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60">
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-semibold">Acuan / GAP</span>
                      <span className="text-[10px] font-bold font-mono text-slate-700 dark:text-slate-300">
                        {item.assessment.penilaian?.gap ? (
                          <span className="text-amber-600 dark:text-amber-400">-{item.assessment.penilaian.gap} Poin</span>
                        ) : item.assessment.penilaian?.acuan ? (
                          `${item.assessment.penilaian.acuan.rendah}-${item.assessment.penilaian.acuan.tinggi}`
                        ) : (
                          '-'
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Rencana Fokus Persiapan */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 print:mb-1 print:text-[10px] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 print:w-3.5 print:h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            3. Rencana Aksi & Fokus Peningkatan Poin
          </h3>
          <div className="bg-blue-50/60 dark:bg-blue-950/40 rounded-3xl print:rounded-lg p-5 print:p-2 border border-blue-200 dark:border-blue-900 text-xs print:text-[8.5px] text-blue-950 dark:text-blue-200 space-y-2.5 print:space-y-1">
            <p className="leading-relaxed print:leading-tight">
              Berdasarkan hasil analisis, berikut rekomendasi prioritas belajar sebelum pendaftaran resmi dibuka:
            </p>
            <ul className="list-disc list-inside space-y-1.5 print:space-y-0.5 text-slate-700 dark:text-slate-300">
              {gapItems.length > 0 ? (
                gapItems.map((item, idx) => (
                  <li key={idx}>
                    <strong className="text-slate-900 dark:text-white">{item?.prodi?.nama || (item?.prodi as any)?.prodiNama || (item?.prodi as any)?.nama_prodi || ''} ({item?.ptn?.singkatan || ''}):</strong> Diperlukan peningkatan
                    sekitar <strong>+{item?.assessment.penilaian?.gap} poin</strong> pada subtes Penalaran
                    Matematika & Literasi Bahasa Inggris untuk menembus ambang batas bawah aman (
                    {item?.assessment.penilaian?.acuan?.rendah}).
                  </li>
                ))
              ) : (
                <li>
                  Komposisi Anda sudah memiliki pilihan dengan posisi aman (Safe) dan realistis (Match).
                  Pertahankan konsistensi skor tryout dan hindari penurunan pada subtes utama.
                </li>
              )}
              <li>
                Bagi pilihan jalur SNBP, pastikan verifikasi PDSS oleh pihak sekolah telah rampung dan nilai
                semester 1-5 telah sinkron tanpa ketidaksesuaian data.
              </li>
            </ul>
          </div>
        </div>

        {/* Section 4: Checklist Syarat & Dokumen Resmi */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 print:mb-1 print:text-[10px] flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 print:w-3.5 print:h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            4. Checklist Kelengkapan Dokumen Pendaftaran SNPMB
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-2.5 sm:gap-3 print:gap-1.5 text-xs print:text-[8px]">
            {[
              'Akun SNPMB Siswa Terverifikasi & Simpan Permanen',
              'Nomor Induk Siswa Nasional (NISN) & NPSN Aktif',
              'Nilai Rapor Semester 1 - 5 yang Telah Divalidasi di PDSS',
              'Pasfoto Resmi Terbaru Berlatar Belakang Polos',
              'Portofolio Khusus (Jika Memilih Prodi Seni / Olahraga)',
              'KIP Kuliah / Dokumen Bukti Afirmasi Ekonomi (Bila Mengajukan)',
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-3 print:p-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl print:rounded-lg border border-slate-200 dark:border-slate-700/80 flex items-center gap-2.5 print:gap-1.5 min-w-0"
              >
                <input type="checkbox" className="rounded text-blue-600 dark:bg-slate-800 border-slate-300 dark:border-slate-600 print:w-3 print:h-3 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300 leading-snug">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Disclaimer & Tautan Resmi */}
        <div className="p-4 print:p-2 bg-amber-50 dark:bg-amber-950/60 rounded-3xl print:rounded-lg border border-amber-200 dark:border-amber-800 text-xs print:text-[8px] text-amber-900 dark:text-amber-200 space-y-2 print:space-y-0.5">
          <div className="flex items-center gap-2 print:gap-1.5 font-bold text-amber-950 dark:text-amber-100 print:text-[8.5px]">
            <AlertTriangle className="w-4 h-4 print:w-3.5 print:h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Catatan Penafian Resmi (Disclaimer Regulasi SNPMB):</span>
          </div>
          <p className="leading-relaxed print:leading-tight">
            "Data pada dokumen ini menggunakan acuan siklus sebelumnya (2026) sebagai referensi pembanding
            empiris. Siswa dan orang tua wajib melakukan pengecekan ulang berkala pada portal resmi SNPMB
            BPPP Kemdikbudristek saat periode pendaftaran resmi dibuka."
          </p>
          <div className="pt-1 print:pt-0.5 flex items-center gap-3">
            <a
              href="https://snpmb.bppp.kemdikbud.go.id"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 print:text-[8px]"
            >
              <span>Portal Resmi SNPMB (bppp.kemdikbud.go.id)</span>
              <ExternalLink className="w-3 h-3 print:w-2.5 print:h-2.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
