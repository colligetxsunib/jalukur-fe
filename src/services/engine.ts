import {
  AssessmentResult,
  CategoryScore,
  ConfidenceLevel,
  ExploreRecommendation,
  GateCheckResult,
  JalurType,
  Prodi,
  StudentProfile,
  StrategyChoice,
  StrategyEvaluation,
} from '../types';
import { PRODI_LIST, PTN_LIST, getProdiOrFallback } from '../data/catalog';

// Helper: Calculate average of rapor grades
export function calculateRaporAverage(nilaiRapor: StudentProfile['nilaiRapor']): number {
  const values = Object.values(nilaiRapor).filter(
    (v): v is number => typeof v === 'number' && !isNaN(v)
  );
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, curr) => acc + curr, 0);
  return Number((sum / values.length).toFixed(1));
}

// 1. Explore Recommendation Deterministic Formula: 0.5 * kemiripan_minat + 0.5 * kesesuaian_nilai
export function computeExploreRecommendations(
  profile: StudentProfile
): ExploreRecommendation[] {
  const { interestScores, nilaiRapor, interestTags } = profile;

  // Group prodis by subject name so recommendations are prodi-level with PTN options
  const prodiCategories: Record<string, Prodi[]> = {};
  PRODI_LIST.forEach((p) => {
    if (!prodiCategories[p.nama]) {
      prodiCategories[p.nama] = [];
    }
    prodiCategories[p.nama].push(p);
  });

  const results: ExploreRecommendation[] = [];

  for (const [namaProdi, prodis] of Object.entries(prodiCategories)) {
    const representative = prodis[0];

    // Calculate Interest Match (0 - 100)
    let interestScoreRaw = 3.0; // default baseline
    const tagMatchCount = representative.tagMinatTerkait.filter((tag) => {
      if (tag === 'Logika & Koding') return interestScores.logikaKoding >= 4;
      if (tag === 'Kesehatan & Biologi') return interestScores.kesehatanBiologi >= 4;
      if (tag === 'Bisnis & Manajemen') return interestScores.bisnisManajemen >= 4;
      if (tag === 'Desain & Kreatif') return interestScores.desainKreatif >= 4;
      if (tag === 'Sosial & Hukum') return interestScores.sosialHukum >= 4;
      if (tag === 'Rekayasa & Fisika') return interestScores.rekayasaFisika >= 4;
      return false;
    }).length;

    // Check specific sub-interest domains
    if (representative.tagMinatTerkait.includes('Logika & Koding')) {
      interestScoreRaw = Math.max(interestScoreRaw, interestScores.logikaKoding);
    }
    if (representative.tagMinatTerkait.includes('Kesehatan & Biologi')) {
      interestScoreRaw = Math.max(interestScoreRaw, interestScores.kesehatanBiologi);
    }
    if (representative.tagMinatTerkait.includes('Bisnis & Manajemen')) {
      interestScoreRaw = Math.max(interestScoreRaw, interestScores.bisnisManajemen);
    }
    if (representative.tagMinatTerkait.includes('Desain & Kreatif')) {
      interestScoreRaw = Math.max(interestScoreRaw, interestScores.desainKreatif);
    }
    if (representative.tagMinatTerkait.includes('Sosial & Hukum')) {
      interestScoreRaw = Math.max(interestScoreRaw, interestScores.sosialHukum);
    }
    if (representative.tagMinatTerkait.includes('Rekayasa & Fisika')) {
      interestScoreRaw = Math.max(interestScoreRaw, interestScores.rekayasaFisika);
    }

    // Additional boost from NLP interest tags
    const hasTagSynergy = (interestTags || []).some((tag) => {
      const lower = tag.toLowerCase();
      if (lower.includes('koding') || lower.includes('software') || lower.includes('komputasi')) {
        return representative.nama.includes('Informasi') || representative.nama.includes('Komputer') || representative.nama.includes('Elektro');
      }
      if (lower.includes('medis') || lower.includes('dokter') || lower.includes('biologi')) {
        return representative.nama.includes('Kedokteran');
      }
      if (lower.includes('manajemen') || lower.includes('bisnis') || lower.includes('uang')) {
        return representative.nama.includes('Manajemen') || representative.nama.includes('Akuntansi');
      }
      if (lower.includes('desain') || lower.includes('art') || lower.includes('visual')) {
        return representative.nama.includes('Desain') || representative.nama.includes('Arsitektur');
      }
      if (lower.includes('hukum') || lower.includes('sosial') || lower.includes('diplomasi')) {
        return representative.nama.includes('Hukum') || representative.nama.includes('Internasional') || representative.nama.includes('Psikologi');
      }
      return false;
    });

    const kemiripanMinat = Math.min(
      100,
      Math.round((interestScoreRaw / 5) * 85 + (tagMatchCount * 5) + (hasTagSynergy ? 10 : 0))
    );

    // Calculate Grade Academic Fit (0 - 100)
    let relevantGradesSum = 0;
    let relevantCount = 0;

    representative.mapelPendukung.forEach((mapel) => {
      let grade: number | undefined;
      const m = mapel.toLowerCase();
      if (m.includes('matematika')) grade = nilaiRapor.matematika;
      else if (m.includes('fisika')) grade = nilaiRapor.fisika;
      else if (m.includes('kimia')) grade = nilaiRapor.kimia;
      else if (m.includes('biologi')) grade = nilaiRapor.biologi;
      else if (m.includes('ekonomi')) grade = nilaiRapor.ekonomi;
      else if (m.includes('sosiologi')) grade = nilaiRapor.sosiologi;
      else if (m.includes('geografi')) grade = nilaiRapor.geografi;
      else if (m.includes('indonesia')) grade = nilaiRapor.bahasaIndonesia;
      else if (m.includes('inggris')) grade = nilaiRapor.bahasaInggris;

      if (grade !== undefined && !isNaN(grade)) {
        relevantGradesSum += grade;
        relevantCount++;
      }
    });

    const avgRelevantGrade = relevantCount > 0 ? relevantGradesSum / relevantCount : calculateRaporAverage(nilaiRapor);
    const kesesuaianNilai = Math.min(100, Math.round((avgRelevantGrade / 100) * 100));

    // Deterministik 50% Minat + 50% Nilai
    const skorTotal = Math.round(0.5 * kemiripanMinat + 0.5 * kesesuaianNilai);

    // Formulate reasoned explanation
    let alasanKecocokan = `Skor minat sebesar ${kemiripanMinat}% selaras dengan preferensi ${representative.tagMinatTerkait.join(' & ')}. Nilai rapor mapel pendukung (${representative.mapelPendukung.join(', ')}) memiliki rerata ${avgRelevantGrade.toFixed(1)}, mencerminkan kesesuaian akademis ${kesesuaianNilai}%.`;

    // Map PTNs offering this prodi
    const ptnTersedia = prodis.map((p) => {
      const ptn = PTN_LIST.find((item) => item.id === p.ptnId);
      return {
        ptnId: p.ptnId,
        ptnNama: ptn ? ptn.nama : p.ptnId,
        dayaTampungSNBT: p.dayaTampungSNBT,
        dayaTampungSNBP: p.dayaTampungSNBP,
        akreditasiProdi: p.akreditasi,
        prodiId: p.id,
      };
    });

    results.push({
      prodiId: representative.id,
      prodiNama: representative.nama,
      rumpun: representative.rumpun,
      skorTotal,
      kemiripanMinat,
      kesesuaianNilai,
      alasanKecocokan,
      peluangKarir: representative.peluangKarir,
      ptnTersedia,
    });
  }

  // Sort descending by total score and return top 5
  return results.sort((a, b) => b.skorTotal - a.skorTotal).slice(0, 5);
}

// 2. Gate Checking: Absolute Requirements
export function checkGateRequirements(
  profile: StudentProfile,
  prodi: Prodi,
  jalur: JalurType
): GateCheckResult {
  const currentYear = 2026;
  const syaratList: GateCheckResult['syarat'] = [];

  if (jalur === 'SNBT') {
    // Syarat 1: Tahun lulus maksimal 3 tahun (2024, 2025, 2026)
    const minYearAllowed = currentYear - 2; // 2024
    const isYearValid = profile.tahunLulus >= minYearAllowed && profile.tahunLulus <= currentYear;
    syaratList.push({
      nama: 'Batas Tahun Kelulusan (Maksimal 3 Tahun Terakhir)',
      keterangan: `Lulusan ${minYearAllowed} - ${currentYear}`,
      status: isYearValid ? 'lolos' : 'gagal',
      alasan: isYearValid
        ? `Tahun kelulusan (${profile.tahunLulus}) memenuhi batas regulasi SNBT.`
        : `Tahun kelulusan (${profile.tahunLulus}) gugur! Batas maksimal SNBT 2026 adalah 3 tahun terakhir (2024, 2025, dan 2026).`,
    });

    // Syarat 2: Akreditasi Sekolah
    const isSchoolValid = ['A', 'B', 'C', 'Belum Terakreditasi'].includes(profile.akreditasiSekolah);
    syaratList.push({
      nama: 'Status Legalitas Satuan Pendidikan',
      keterangan: 'SMA/MA/SMK/Paket C Terdaftar',
      status: isSchoolValid ? 'lolos' : 'data_kurang',
      alasan: isSchoolValid ? 'Sekolah terdata sah di Kemendikbudristek.' : 'Data akreditasi sekolah belum valid.',
    });

    // Syarat 3: Skor Tryout UTBK
    if (!profile.skorTryout || profile.skorTryout <= 0) {
      syaratList.push({
        nama: 'Skor Hasil Tryout UTBK',
        keterangan: 'Memerlukan angka skor tryout simulasi (300 - 850)',
        status: 'data_kurang',
        alasan: 'Skor tryout belum diisi. Masukkan skor simulasi untuk menghitung kategori peluang.',
      });
    } else {
      syaratList.push({
        nama: 'Skor Hasil Tryout UTBK',
        keterangan: `Skor terinput: ${profile.skorTryout}`,
        status: 'lolos',
        alasan: `Skor tryout ${profile.skorTryout} siap dianalisis terhadap batas acuan.`,
      });
    }
  } else {
    // Jalur SNBP
    // Syarat 1: Hanya siswa kelas 12 aktif tahun 2026
    const isSnbpYearValid = profile.tahunLulus === currentYear;
    syaratList.push({
      nama: 'Status Kelas 12 Aktif (Lulusan Berjalan 2026)',
      keterangan: `Hanya untuk Lulusan ${currentYear}`,
      status: isSnbpYearValid ? 'lolos' : 'gagal',
      alasan: isSnbpYearValid
        ? 'Siswa terdaftar sebagai kelas 12 aktif tahun 2026.'
        : `Tahun kelulusan (${profile.tahunLulus}) tidak memenuhi syarat SNBP. SNBP hanya untuk siswa lulusan tahun berjalan (${currentYear}).`,
    });

    // Syarat 2: Akreditasi Sekolah & Kuota Siswa Eligible
    const kuotaPercent =
      profile.akreditasiSekolah === 'A'
        ? 40
        : profile.akreditasiSekolah === 'B'
        ? 25
        : profile.akreditasiSekolah === 'C'
        ? 5
        : 0;

    let isEligibleRank = true;
    let rankDesc = `Sekolah Akreditasi ${profile.akreditasiSekolah} berhak kuota ${kuotaPercent}% siswa terbaik.`;

    if (profile.peringkatParalel && profile.totalSiswaAngkatan && profile.totalSiswaAngkatan > 0) {
      const maxRank = Math.floor((kuotaPercent / 100) * profile.totalSiswaAngkatan);
      if (profile.peringkatParalel > maxRank) {
        isEligibleRank = false;
        rankDesc = `Peringkat ke-${profile.peringkatParalel} dari ${profile.totalSiswaAngkatan} siswa melebihi kuota eligible (maksimal peringkat ${maxRank} untuk akreditasi ${profile.akreditasiSekolah}).`;
      } else {
        rankDesc = `Peringkat ke-${profile.peringkatParalel} masuk dalam kuota eligible sekolah (maksimal peringkat ${maxRank}).`;
      }
    }

    syaratList.push({
      nama: 'Kelayakan Kuota Eligible Sekolah',
      keterangan: `Akreditasi ${profile.akreditasiSekolah} (${kuotaPercent}% Kuota)`,
      status: isEligibleRank ? 'lolos' : 'gagal',
      alasan: rankDesc,
    });

    // Syarat 3: Rapor Semester 1-5
    const raporAvg = calculateRaporAverage(profile.nilaiRapor);
    if (raporAvg <= 0) {
      syaratList.push({
        nama: 'Kelengkapan Nilai Rapor Semester 1-5',
        keterangan: 'Nilai mapel utama',
        status: 'data_kurang',
        alasan: 'Nilai rapor semester 1-5 belum lengkap terisi.',
      });
    } else {
      syaratList.push({
        nama: 'Kelengkapan Nilai Rapor Semester 1-5',
        keterangan: `Rata-rata: ${raporAvg}`,
        status: 'lolos',
        alasan: `Nilai rapor terverifikasi dengan rata-rata ${raporAvg}.`,
      });
    }
  }

  const hasGagal = syaratList.some((s) => s.status === 'gagal');
  const hasDataKurang = syaratList.some((s) => s.status === 'data_kurang');

  let status: GateCheckResult['status'] = 'lolos';
  let alasanGagal: string | undefined;

  if (hasGagal) {
    status = 'gagal';
    const failedItem = syaratList.find((s) => s.status === 'gagal');
    alasanGagal = failedItem?.alasan || 'Tidak memenuhi salah satu syarat mutlak regulasi nasional.';
  } else if (hasDataKurang) {
    status = 'data_kurang';
  }

  return {
    lolos: status === 'lolos',
    status,
    syarat: syaratList,
    alasanGagal,
  };
}

// 3. Penilaian Reach / Match / Safe (Hanya jika lolos Gate)
export function assessTargetProdi(
  profile: StudentProfile,
  prodi: Prodi,
  jalur: JalurType,
  overrideSkorTryout?: number
): AssessmentResult {
  const gate = checkGateRequirements(profile, prodi, jalur);

  // STRICT RULE: If Gate failed or data_kurang, DO NOT evaluate Reach/Match/Safe!
  if (!gate.lolos) {
    return {
      prodiId: prodi.id,
      jalur,
      gate,
      sumberUrl: prodi.sumberUrl,
      terakhirDiverifikasi: prodi.terakhirDiverifikasi,
    };
  }

  // Tahap 2: Lolos Gate -> Lakukan Penilaian
  if (jalur === 'SNBT') {
    const skor = overrideSkorTryout ?? profile.skorTryout ?? 0;
    const acuan = prodi.acuanSkorUTBK;

    if (!acuan || acuan.status === 'belum_ada_acuan' || acuan.rendah === 0) {
      return {
        prodiId: prodi.id,
        jalur,
        gate,
        penilaian: {
          kategori: 'BELUM_ADA_ACUAN',
          skorSiswa: skor,
          acuan: {
            rendah: 0,
            tinggi: 0,
            tahun: 2026,
            status: 'belum_ada_acuan',
          },
        },
        sumberUrl: prodi.sumberUrl,
        terakhirDiverifikasi: prodi.terakhirDiverifikasi,
      };
    }

    let kategori: CategoryScore = 'MATCH';
    let gap: number | undefined;

    if (skor >= acuan.tinggi) {
      kategori = 'SAFE';
    } else if (skor >= acuan.rendah) {
      kategori = 'MATCH';
    } else {
      kategori = 'REACH';
      gap = acuan.rendah - skor;
    }

    // Visual relative position: min range = acuan.rendah - 80, max range = acuan.tinggi + 50
    const minScale = acuan.rendah - 60;
    const maxScale = acuan.tinggi + 40;
    const posisiPersen = Math.min(100, Math.max(0, Math.round(((skor - minScale) / (maxScale - minScale)) * 100)));

    return {
      prodiId: prodi.id,
      jalur,
      gate,
      penilaian: {
        kategori,
        skorSiswa: skor,
        acuan,
        gap,
        posisiPersen,
      },
      sumberUrl: prodi.sumberUrl,
      terakhirDiverifikasi: prodi.terakhirDiverifikasi,
    };
  } else {
    // SNBP Assessment (MUST BE INDIKATIF, NO PERCENTAGE CHANCE)
    const alumniStatus = profile.alumniDiterima?.[prodi.id];
    let tingkatKeyakinan: ConfidenceLevel = 'Rendah';

    if (alumniStatus === true) {
      tingkatKeyakinan = profile.trenNilai === 'Naik' ? 'Tinggi' : 'Sedang';
    } else if (alumniStatus === false) {
      tingkatKeyakinan = 'Rendah';
    } else {
      tingkatKeyakinan = 'Rendah'; // Not yet answered
    }

    const raporAvg = calculateRaporAverage(profile.nilaiRapor);
    let kategori: CategoryScore = 'MATCH';

    if (raporAvg >= 89 && alumniStatus === true && profile.akreditasiSekolah === 'A') {
      kategori = 'SAFE';
    } else if (raporAvg >= 84) {
      kategori = 'MATCH';
    } else {
      kategori = 'REACH';
    }

    return {
      prodiId: prodi.id,
      jalur,
      gate,
      penilaian: {
        kategori,
        skorSiswa: raporAvg,
        snbpDetails: {
          isIndikatif: true,
          tingkatKeyakinan,
          adaAlumni: alumniStatus ?? null,
          faktorBelumDiketahui: [
            'Indeks Prestasi Kumulatif (IPK) dan reputasi alumni asal sekolahmu di prodi ini',
            'Kebijakan afirmasi regional & kuota persebaran wilayah yang ditetapkan PTN bersangkutan',
            'Daftar portofolio serta sertifikat kompetisi berjenjang milik pendaftar pesaing',
          ],
          penjelasan: alumniStatus === true
            ? 'Adanya rekam jejak alumni sekolah yang diterima tahun lalu meningkatkan bobot indeks sekolah pada seleksi prodi ini.'
            : alumniStatus === false
            ? 'Belum adanya riwayat alumni sekolah yang diterima di prodi ini membuat tingkat keyakinan prediktif berada pada level Rendah.'
            : 'Informasi keberadaan alumni sekolah belum diisi. Tingkat keyakinan otomatis diatur Rendah demi menjaga kehati-hatian analisis.',
        },
      },
      sumberUrl: prodi.sumberUrl,
      terakhirDiverifikasi: prodi.terakhirDiverifikasi,
    };
  }
}

// 4. Strategy Composition Evaluator & Auto-Swap Recommendation
export function evaluateStrategyComposition(
  choices: StrategyChoice[],
  profile: StudentProfile,
  overrideSkorTryout?: number
): StrategyEvaluation {
  let safeCount = 0;
  let matchCount = 0;
  let reachCount = 0;
  let belumAdaAcuanCount = 0;

  const warnings: string[] = [];
  const ptnCountMap: Record<string, number> = {};

  const assessedChoices = choices.map((c) => {
    const prodi = getProdiOrFallback(c.prodiId);
    ptnCountMap[prodi.ptnId] = (ptnCountMap[prodi.ptnId] || 0) + 1;

    const assessment = assessTargetProdi(profile, prodi, c.jalur, overrideSkorTryout);
    return {
      choice: c,
      prodi,
      assessment,
    };
  });

  assessedChoices.forEach((item) => {
    if (!item?.assessment.penilaian) return;
    const cat = item.assessment.penilaian.kategori;
    if (cat === 'SAFE') safeCount++;
    else if (cat === 'MATCH') matchCount++;
    else if (cat === 'REACH') reachCount++;
    else if (cat === 'BELUM_ADA_ACUAN') belumAdaAcuanCount++;
  });

  const totalChoices = assessedChoices.length;

  // Rule 1: Minimal harus ada 1 pilihan SAFE
  if (totalChoices > 0 && safeCount === 0) {
    warnings.push('Komposisi berisiko: Belum ada pilihan berstatus SAFE sebagai jaring pengaman utama.');
  }

  // Rule 2: Maksimal 50% pilihan REACH
  if (totalChoices > 0 && reachCount / totalChoices > 0.5) {
    warnings.push(`Terlalu banyak pilihan REACH (${reachCount} dari ${totalChoices} pilihan). Disarankan maksimal 50% untuk menjaga peluang kelulusan.`);
  }

  // Rule 3: Single PTN dominance
  const dominantPtnEntry = Object.entries(ptnCountMap).find(([, count]) => count >= 3);
  if (dominantPtnEntry) {
    const ptn = PTN_LIST.find((p) => p.id === dominantPtnEntry[0]);
    warnings.push(`Pilihan terkonsentrasi di ${ptn?.singkatan || dominantPtnEntry[0]} (${dominantPtnEntry[1]} prodi). Membagi pilihan ke lebih dari satu PTN memperluas diversifikasi peluang.`);
  }

  // Auto-Swap suggestions if composition is unbalanced
  const saranSwap: StrategyEvaluation['saranSwap'] = [];

  if ((safeCount === 0 || reachCount >= 2) && assessedChoices.length > 0) {
    // Find the first reach choice
    const reachItem = assessedChoices.find((i) => i?.assessment.penilaian?.kategori === 'REACH');
    if (reachItem) {
      // Find a safe or match alternative from the same rumpun
      const alternative = PRODI_LIST.find((p) => {
        if (p.id === reachItem.prodi.id) return false;
        if (p.rumpun !== reachItem.prodi.rumpun) return false;
        const testAssess = assessTargetProdi(profile, p, reachItem.choice.jalur, overrideSkorTryout);
        return testAssess.penilaian?.kategori === 'SAFE' || testAssess.penilaian?.kategori === 'MATCH';
      });

      if (alternative) {
        const altPtn = PTN_LIST.find((ptn) => ptn.id === alternative.ptnId);
        saranSwap.push({
          prodiIdTarget: reachItem.prodi.id,
          alasan: `Tukar salah satu pilihan REACH (${reachItem.prodi.nama}) dengan prodi yang memiliki ambang batas skor lebih realistis agar strategi Anda memiliki penopang aman.`,
          rekomendasiPenggantiProdiId: alternative.id,
          rekomendasiNama: `${altPtn?.singkatan || ''} - ${alternative.nama}`,
        });
      }
    }
  }

  return {
    isBalanced: warnings.length === 0,
    safeCount,
    matchCount,
    reachCount,
    belumAdaAcuanCount,
    warnings,
    saranSwap: saranSwap.length > 0 ? saranSwap : undefined,
  };
}
