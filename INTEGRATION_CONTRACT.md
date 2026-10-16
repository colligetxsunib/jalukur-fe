# JalurKu — Integration Contract (Backend ⇄ Frontend)

> Task 0 artifact. **Hasil verifikasi dari source code backend**, bukan tebakan.
> Sumber: `app_build/jalurku-be/app/api/v1/*.py`, `app/schemas/*.py`, `app/services/*.py`.
> FE: `app_build/jalurku-fe/src/services/api.ts`, `src/types/index.ts`.
> Base URL live: `VITE_API_BASE_URL` → default `http://localhost:8000/api/v1`.
>
> Semua error backend memakai envelope standar:
> `{ "error": { "kode": string, "pesan": string, "detail": object } }` (`app/core/errors.py`).
> Semua request schema backend memakai `extra="forbid"` → field asing = **422**.

---

## Ringkasan status sinkronisasi per endpoint

| Endpoint            | Method | Request FE saat ini                                                           | Request yang dibutuhkan BE                                      | Response BE (field aktual)                                                                                                        | Status                                   |
| ------------------- | ------ | ----------------------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `/session`          | POST   | `{consent, consent_at}`                                                       | `{consent, consent_version}`                                    | `{token, expires_at, sisa_detik, pemberitahuan}`                                                                                  | ❌ field + response shape                |
| `/session`          | GET    | tanpa token                                                                   | butuh token                                                     | `{aktif, dibuat_pada, consent_at, consent_version, expires_at, sisa_detik, pemberitahuan}`                                        | ❌ token tak dikirim + shape             |
| `/session`          | DELETE | tanpa token                                                                   | butuh token                                                     | `204 No Content` (body kosong)                                                                                                    | ❌ token tak dikirim                     |
| `/profile`          | GET    | —                                                                             | butuh token                                                     | `{profil, data_kurang, pertanyaan}`                                                                                               | ❌ shape ≠ `StudentProfile`              |
| `/profile`          | PUT    | `StudentProfile` mentah                                                       | `ProfilePatch` (snake_case)                                     | `{profil, data_kurang, pertanyaan}`                                                                                               | ❌ payload + response                    |
| `/catalog/ptn`      | GET    | — (baca `PTN[]`)                                                              | query params                                                    | `{items, total, page, limit, total_halaman}`                                                                                      | ❌ paginasi, bukan array                 |
| `/catalog/prodi`    | GET    | — (baca `Prodi[]`)                                                            | query params                                                    | `{items, total, page, limit, total_halaman}`                                                                                      | ❌ paginasi, bukan array                 |
| `/explore`          | POST   | `{profile}`                                                                   | `{top_n?, jalur?}` atau `{}`                                    | `{rekomendasi, data_kurang, jalur, indikatif, catatan}`                                                                           | ❌ payload + unwrap `rekomendasi`        |
| `/riasec/questions` | GET    | —                                                                             | publik (tanpa token OK)                                         | `{versi_instrumen, sumber, skala, min_terjawab, dimensi, item[]}`                                                                 | ✅ sinkron                               |
| `/riasec/submit`    | POST   | `{jawaban, simpan}`                                                           | `{jawaban, simpan}`                                             | `{versi_instrumen, skor_norm, skor_mentah, holland_code, dimensi_teratas, jumlah_item, terjawab, total_item, tersimpan, catatan}` | ✅ sinkron                               |
| `/riasec/cerita`    | POST   | `{cerita, simpan}`                                                            | **ENDPOINT TIDAK ADA**                                          | —                                                                                                                                 | ❌ 404 (lihat §Ambigu)                   |
| `/analyze`          | POST   | `{targets:[{prodi_id,jalur}], override:{skor_tryout?}}`                       | sama                                                            | `{hasil: [...]}` (dibungkus)                                                                                                      | ❌ unwrap `hasil`                        |
| `/strategy`         | POST   | `{choices:[{urutan,prodi_id,jalur}], override:{skor_tryout,nilai_rapor_avg}}` | `{jalur, pilihan:[{prodi_id}], shortlist?, override?, simpan?}` | `{jalur, batas_pilihan, hasil, komposisi, temuan, disimpan, strategy_id, catatan}`                                                | ❌ payload + response                    |
| `/query`            | POST   | `{pertanyaan, konteks:{prodiId,jalur}}`                                       | `{pertanyaan, mode?, konteks:{prodi_id,jalur,override?}}`       | `{jawaban, sumber, yakin, data_dibutuhkan, saran_pertanyaan, fallback, mode, jenis_jawaban, catatan}`                             | ❌ `prodiId`→`prodi_id` + response shape |

Legenda: ✅ sinkron · ❌ perlu perbaikan.

---

## Detail field response aktual (verbatim dari service layer)

### POST `/session` → `SessionCreated` (`schemas/session.py`, `api/v1/session.py`)

```
token: str
expires_at: datetime (ISO)
sisa_detik: int
pemberitahuan: str
```

FE `SessionData` butuh `{sessionId, token, consentAt, createdAt, profileCompleted}` → **hanya `token` yang cocok**. `sessionId`/`profileCompleted` tidak ada di response. Status code sukses = **201**.

Validasi BE: `consent !== true` → **400 `consent_diperlukan`**. `consent_version` kosong/absen → **422 `validasi_gagal`**.

### GET `/session` → `SessionStatus`

```
aktif: bool = True
dibuat_pada: datetime
consent_at: datetime
consent_version: str
expires_at: datetime
sisa_detik: int
pemberitahuan: str
```

Butuh token (`sesi_saat_ini`). Tanpa token → **401 `tidak_terautentikasi`**.

### DELETE `/session`

Sukses = **204** tanpa body. Butuh token.

### GET/PUT `/profile` → `ProfilResponse` (`services/profile.py` → `ke_respons`)

```
profil: dict[str, Any]            # seluruh PROFIL_FIELDS; field belum diisi = null
data_kurang: dict[str, list[str]] # per jalur: {"SNBP": [field...], "SNBT": [field...]}
pertanyaan: dict[str, str]        # field -> teks pertanyaan
```

PUT memvalidasi body sebagai `ProfilePatch`. **Bukan** `StudentProfile`.

`ProfilePatch` (field relevan, snake_case):

```
tahun_lulus: int|null (1900..2200)
provinsi: str|null (harus 1 dari 38 provinsi baku)
jenjang_sekolah: "SMA"|"SMK"|"MA"|"Paket C" | null
akreditasi_sekolah: "A"|"B"|"C"|"tidak_terakreditasi" | null
nilai_rapor: { semester_1..semester_6 : { <mapel snake_case> : 0..100|null } } | null
minat: { <kunci bebas 1..64 char> : 0..1|null } | null
skor_tryout: float|null
peringkat_sekolah: int|null (>=1)
jumlah_siswa_angkatan: int|null (>=1)
alumni_info: { <kunci> : "ya"|"tidak"|"tidak_tahu"|null } | null
konfirmasi_syarat_prodi: { <prodi_id> : bool|null } | null
... (+ flag boolean syarat administratif)
```

> Perhatikan: **tidak ada** `nilai_rapor_avg`, `trenNilai`, `interestScores`, `interestTags`, `freeStoryText` di `ProfilePatch`. Field FE `akreditasiSekolah: 'Belum Terakreditasi'` memetakan ke `'tidak_terakreditasi'`.

### GET `/catalog/ptn` & `/catalog/prodi` → `_bungkus(...)` (`services/katalog.py`)

```
items: [...]
total: int
page: int
limit: int
total_halaman: int
```

PTN item: `{id, nama, provinsi, jumlah_prodi}`.
Prodi item: `{id, nama, ptn:{id,nama,provinsi}, rumpun, jenjang, program, akreditasi, jalur_dibuka, punya_data_keketatan, status_verifikasi}`.

> **Bukan** array polos. FE harus baca `res.data.items`. Query params: `q, provinsi, page, limit` (+ prodi: `rumpun, jalur, ptn_id, program, jenjang`). Butuh token (`sesi_saat_ini`).
> Bentuk item BE **tidak** sama dengan tipe FE `PTN`/`Prodi` (mis. tak ada `kode`, `singkatan`, `dayaTampungSNBT`, `acuanSkorUTBK`). Perlu adapter bila konsumen FE mengandalkan field tersebut.

### POST `/explore` → `jelajahi(...)` (`services/eksplorasi.py`)

```
rekomendasi: [ { rumpun, skor_kecocokan, komponen:{minat,nilai}, bobot_efektif,
                 alasan, mapel_belum_diisi, contoh_profesi, sumber_profil,
                 total_prodi, prodi_ids[], ptn[], kelayakan|null } ]
data_kurang: [ {field, pertanyaan} ]
jalur: str|null
indikatif: true
catatan: [str]
```

> FE harus unwrap **`rekomendasi`** (bukan `hasil`). Request hanya `{top_n?, jalur?}`; profil dibaca BE dari sesi. Item `rekomendasi` **tidak** cocok dengan tipe FE `ExploreRecommendation` (FE pakai `prodiId, prodiNama, skorTotal, kemiripanMinat, kesesuaianNilai, alasanKecocokan, peluangKarir, ptnTersedia`). Perlu adapter penuh.

### POST `/analyze` → `{"hasil": analisis_banyak(...)}` (`api/v1/analyze.py`)

Objek pembungkus:

```
{ hasil: [ AnalisisItem... ] }
```

`AnalisisItem` (`services/analisis.py` → `analisis_satu`):

```
prodi_id, jalur,
prodi: {nama, ptn_id, ptn_nama, ptn_provinsi, jenjang, program},
gate: {status, syarat:[...], ...},
penilaian: {kategori, ...} | null,
sumber: [url...],
sumber_detail: [{jenis,url,terakhir_diverifikasi,status_verifikasi}],
terakhir_diverifikasi: str|null,
status_verifikasi: str,
data_kurang: [{field, pertanyaan}],
catatan: [str]
```

> FE harus unwrap **`res.data.hasil`**. Item BE **tidak** cocok dengan tipe FE `AssessmentResult` (FE pakai `prodiId`, `gate` bentuk lain, `penilaian.skorSiswa`, `snbpDetails`, dll). Perlu adapter.

### POST `/strategy` → `evaluasi_strategi(...) + patch endpoint` (`services/strategi.py`, `api/v1/strategy.py`)

```
jalur: str
batas_pilihan: int
hasil: [ AnalisisItem... ]        # sama bentuk dengan item /analyze
komposisi: {...}                  # dari hitung_komposisi(pilihan)
temuan: [ {...}.ke_dict() ]       # peringatan + saran swap
disimpan: bool                    # ditambah di endpoint
strategy_id: str|null             # ditambah di endpoint
catatan: [str]                    # ditambah di endpoint
```

> FE tipe `StrategyEvaluation` butuh `{isBalanced, safeCount, matchCount, reachCount, belumAdaAcuanCount, warnings, saranSwap[]}` — **tidak satu pun** nama ini ada di response BE. Pemetaan harus diturunkan dari `komposisi` + `temuan` (butuh keputusan, lihat §Ambigu).
> Request BE: `{jalur (wajib), pilihan:[{prodi_id}], shortlist?, override?, simpan?}`. Item `pilihan` **hanya** `prodi_id` (`urutan`/`jalur` per item → 422).

### POST `/query` → `_respons(...)` (`services/query.py`)

```
jawaban: str
sumber: [ {judul, url, halaman} ]
yakin: bool
data_dibutuhkan: [ {field, pertanyaan} ]
saran_pertanyaan: [str]
fallback: bool
mode: str
jenis_jawaban: str
catatan: [str]
```

> FE tipe `AIQueryResponse` butuh `{jawaban, yakin, kategoriKeyakinan, sumber:[RagCitation], dataDibutuhkan, saranPertanyaan}`. Mismatch nama: `data_dibutuhkan`→`dataDibutuhkan`, `saran_pertanyaan`→`saranPertanyaan`; `kategoriKeyakinan` **tidak ada** di BE (harus diturunkan dari `yakin`/`jenis_jawaban`). `RagCitation` FE butuh `{judul, dokumen, halaman, url, kutipan}` tapi BE `sumber` hanya `{judul, url, halaman}` (tanpa `dokumen`/`kutipan`).
> Request: `konteks.prodi_id` (snake_case). `mode: 'jelaskan'` mewajibkan `konteks.prodi_id` + `konteks.jalur` (else 422 via `field_wajib_kurang`).

---

## Konfirmasi `/riasec/cerita`

**Terkonfirmasi TIDAK ADA.** `app/api/v1/riasec.py` hanya mendaftarkan:

- `GET /riasec/questions` → `pertanyaan`
- `POST /riasec/submit` → `submit`

Tidak ada route `/riasec/cerita`. FE `parseRiasecCerita()` memanggilnya → **404** di mode live → selalu jatuh ke fallback lokal `parseCeritaLocal`.

---

## Titik yang masih AMBIGU (butuh keputusan — Task 9)

1. **Pemetaan `nilai_rapor` flat ↔ berstruktur.** FE `RaporMapel` flat (`matematika`, `bahasaIndonesia`, ...). BE `ProfilePatch.nilai_rapor` = `{semester_N: {mapel: nilai}}`. Belum jelas: semester mana yang diisi dan nama mapel baku (snake*case) yang diterima BE. **Perlu daftar mapel resmi dari pemilik backend.** (Catatan: nama mapel divalidasi hanya oleh regex `^[a-z]a-z0-9*]{1,40}$`, jadi BE menerima kunci bebas — konvensi penamaan tetap harus disepakati agar cocok dengan logika domain.)
2. **`nilai_rapor_avg` pada override `/strategy` & `/analyze`.** Tidak ada di `ProfilePatch` → mengirimnya = 422. Keputusan: hapus dari FE atau BE menambah field.
3. **Adapter response penuh** untuk `/analyze`, `/strategy`, `/explore`, `/query`, `/profile`, `/catalog`. Nama & bentuk field BE (Indonesia, nested beda) berbeda jauh dari tipe FE. Perlu keputusan: tulis adapter di `api.ts`, atau selaraskan tipe FE dengan bentuk BE. Pemetaan `StrategyEvaluation` (dari `komposisi`+`temuan`) dan `AIQueryResponse.kategoriKeyakinan` (dari `yakin`/`jenis_jawaban`) khususnya non-trivial.
4. **`/riasec/cerita`.** Backend menambah endpoint, atau `parseRiasecCerita` ditandai demo-only.
5. **Catalog item shape.** Tipe FE `PTN`/`Prodi` jauh lebih kaya dari item BE. Perlu keputusan apakah UI live benar-benar butuh field itu, atau cukup memakai subset BE.

---

## Yang sudah SINKRON (aman, tidak perlu diubah)

- `GET /riasec/questions` ⇄ `RiasecQuestionsResponse` — field cocok 1:1.
- `POST /riasec/submit` ⇄ `RiasecResult` — `{jawaban, simpan}` request & `{versi_instrumen, skor_norm, skor_mentah, holland_code, dimensi_teratas, jumlah_item, terjawab, total_item, tersimpan, catatan}` response cocok.
- Request body `/analyze` (`{targets:[{prodi_id, jalur}]}`) sudah benar; hanya response yang perlu di-unwrap.

---

# Task 9 — Keputusan (diturunkan dari source backend, bukan tebakan)

> Metode @pm: tidak ada pemilik backend eksternal yang bisa dihubungi dalam sesi ini,
> jadi keputusan diturunkan langsung dari **source of truth backend** (`config/app.yaml`,
> `app/domain/profil.py`, `app/domain/ringkasan.py`, `app/api/v1/riasec.py`). Di mana source
> jelas, keputusan dianggap FINAL. Di mana source menandai dirinya DRAFT/belum diverifikasi,
> ditandai sebagai **butuh sign-off manusia** sebelum dianggap kontrak tetap.

## Keputusan 1 — Pemetaan `nilaiRapor`

**Semester:** backend `app/domain/ringkasan.py` → `SEMESTER_DIPAKAI = ("semester_1" .. "semester_5")`.
Hanya **semester_1 sampai semester_5** yang dipakai mesin aturan (semester_6 diabaikan).
FE menyimpan rapor flat tanpa dimensi semester. **Keputusan:** isi nilai flat yang sama ke
kelima semester_1..5, ATAU (lebih benar) UI menambah input per-semester. Karena FE saat ini
flat, pendekatan paling aman: kirim nilai flat sebagai `semester_5` saja (semester terakhir
yang dipakai) — menghindari menduplikasi angka yang sama ke 5 slot yang menyesatkan rata-rata.

> Status: **butuh sign-off**. Ada tradeoff (satu semester vs lima). Rekomendasi @pm: isi ke
> `semester_5` saja sampai UI mendukung input per-semester, karena menduplikasi nilai identik
> ke 5 semester memalsukan "tren nilai" yang juga dibaca mesin aturan.

**Nama mapel baku (snake_case)** — dari `config/app.yaml` (`explore.rumpun.*.mapel`), ini nama
mapel kanonik yang dikenali backend:
`matematika, fisika, kimia, biologi, ekonomi, sosiologi, sejarah, bahasa_indonesia,
bahasa_inggris, informatika, pkn, seni_budaya, geografi`.
Pemetaan `RaporMapel` (FE) → kunci backend:

```
matematika      → matematika
fisika          → fisika
kimia           → kimia
biologi         → biologi
ekonomi         → ekonomi
sosiologi       → sosiologi
geografi        → geografi
bahasaIndonesia → bahasa_indonesia
bahasaInggris   → bahasa_inggris
```

> Status: nama mapel **FINAL** (terbukti dari config). Catatan: backend hanya memvalidasi nama
> mapel via regex `^[a-z][a-z0-9_]{1,40}$`, jadi nama di atas diterima; yang penting cocok dengan
> `prodi.mapel_penentu` di katalog agar ikut terhitung di `rata_mapel`.

## Keputusan 2 — `nilai_rapor_avg` pada override `/strategy` & `/analyze`

Field ini **tidak ada** di `ProfilePatch` dan tidak dipakai mesin aturan (penilaian memakai
`nilai_rapor` berstruktur + `skor_tryout`, bukan rata-rata agregat). **Keputusan: HAPUS dari FE.**
Tidak ada alasan backend menambahnya — rata-rata dihitung server dari `nilai_rapor`.

> Status: **FINAL**. Sudah dihapus di Task 6.

## Keputusan 3 — Endpoint `/riasec/cerita`

`app/api/v1/riasec.py` hanya `GET /riasec/questions` & `POST /riasec/submit`. Endpoint
`/riasec/cerita` **tidak ada** dan tidak ada rencana tertulis di router/schema.
**Keputusan: `parseRiasecCerita` ditandai DEMO-ONLY** — selalu pakai fallback lokal
`parseCeritaLocal`, tidak memanggil live (menghindari 404 yang pasti).

> Status: **FINAL** untuk sekarang. Bila backend kelak menambah endpoint + schema, cabut flag demo-only.

## Keputusan turunan — minat (`interestScores`)

FE `interestScores` (6 kunci: logikaKoding, kesehatanBiologi, ...) skala **1–5**. Backend `minat`
pakai dimensi **RIASEC** (`realistis, investigatif, artistik, sosial, enterprising, konvensional`)
skala **0..1**. Kedua sumbu **tidak sepadan** (nama dimensi beda, skala beda). Backend juga mengisi
`minat` dari **RIASEC submit** (`/riasec/submit simpan=true`), bukan dari input manual interestScores.
**Keputusan:** JANGAN kirim `interestScores` sebagai `minat` di `toProfilePatch`. Sumber minat
untuk backend adalah alur RIASEC (`/riasec/submit`), yang sudah sinkron.

> Status: **FINAL**. Konsisten dengan desain backend (minat diisi via RIASEC).
