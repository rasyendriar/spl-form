# Form SPL — Pengajuan & Rekap Lembur

Aplikasi web untuk mengumpulkan pengajuan lembur dari tim lapangan, dengan panel
admin untuk mengatur batas waktu (cut off) pengisian, mengelola akun user, dan
mengekspor rekap data.

## Fitur

- **Login user & admin.** Setiap orang login dengan username/password yang
  dibuatkan oleh admin (tanpa registrasi mandiri).
- **Form pengajuan lembur** (untuk user lapangan):
  - Tanggal lembur bebas dipilih (bisa hari lain untuk rencana ke depan —
    termasuk lembur hari Minggu yang diajukan dari hari Sabtu).
  - **Pilih nama dari database karyawan** (ketik untuk mencari, tinggal
    klik) — atau tetap bisa ketik bebas untuk orang yang belum terdaftar.
  - **Jam mulai & jam selesai bebas ditentukan sendiri** oleh yang lembur
    (tidak ada standarisasi jam), memakai satu pemilih jam 24 jam sekali
    pilih (`23:20`, bukan format AM/PM, dan tidak perlu pilih jam & menit
    terpisah).
  - **Jam istirahat otomatis dikeluarkan dari hitungan lembur**: 12:30–13:30
    (istirahat siang) dan 17:30–18:30 (istirahat sore) — kalau jam lemburmu
    melewati salah satu (atau keduanya), durasi yang tercatat sudah bersih
    tanpa jam istirahat itu.
  - Bisa mengisi **beberapa orang sekaligus untuk pekerjaan yang sama** (klik
    "Tambah Orang"), dan **beberapa pekerjaan berbeda dalam satu kali
    submit** (klik "Tambah Pekerjaan Lain") — cocok untuk foreman yang
    input lembur satu tim sekaligus.
  - Status pengajuan (Menunggu/Disetujui/Ditolak) langsung terlihat di
    riwayat, termasuk alasan bila ditolak.
- **Riwayat pengajuan** milik user sendiri; bisa dihapus selama masih
  berstatus "Menunggu" (yang sudah diproses admin terkunci dari user).
- **Panel admin:**
  - **Dashboard**: kartu ringkasan (total jam lembur bersih, **jam kotor
    sebagai dasar gaji**, total pengajuan, jumlah orang aktif, rata-rata
    jam/orang) beserta perbandingan ke bulan lalu, ranking jam lembur per
    orang (bersih & kotor), dan tren harian — bisa difilter per status
    (default: yang sudah **Disetujui** saja).
  - **Pengajuan**: rekap semua pengajuan lembur (filter tanggal & status),
    **approve/reject** dengan alasan penolakan opsional, **edit** data lembur
    secara manual, ekspor rekap ke Excel (termasuk kolom jam bersih & jam
    kotor), dan **export format harian** yang mengikuti format kolom & sel
    gabungan (merge) template internal (termasuk jam istirahat otomatis).
  - **Kelola Karyawan**: database karyawan (NIK, nama, section, posisi,
    grup) yang dipakai sebagai sumber dropdown nama di form — tambah satu
    per satu, edit, hapus, atau impor massal dengan cara tempel dari Excel.
  - **Kelola User**: admin membuat username & password untuk user lapangan
    (atau admin lain), reset password, dan menghapus user.
  - **Pengaturan**: batas waktu (cut off) pengisian harian, terpisah untuk
    **Senin–Jumat**, **Sabtu**, dan **Minggu**, plus tombol darurat untuk
    menutup form secara manual kapan pun.
- **Ganti password** mandiri untuk setiap user yang sudah login.
- Tampilan bergaya kartu, terinspirasi Apple, dengan header kaca (frosted
  glass), ikon, animasi halus, dan dioptimalkan untuk HP (mobile-friendly)
  — mengisi form maupun mengatur pengaturan bisa nyaman lewat smartphone.

## Aturan Perhitungan Jam Lembur

Dua aturan bisnis berikut dihitung otomatis oleh sistem (kode di
`lib/utils.ts`, fungsi `parseDurationMinutes` dan `grossPayMinutes`):

1. **Jam istirahat tidak dihitung lembur.** Ada dua jendela istirahat tetap:
   **12:30–13:30** dan **17:30–18:30**. Jika rentang jam mulai–selesai yang
   diisi user melewati salah satu (atau kedua) jendela ini, waktu yang
   tumpang tindih otomatis dikurangi dari durasi lembur. Contoh: lembur
   17:00–20:00 (3 jam) memotong 1 jam istirahat sore → tercatat 2 jam bersih.
2. **Jam kotor (dasar pembayaran gaji)**: 30 menit pertama dari durasi
   bersih dihitung 1x, sisanya dihitung 1,5x. Contoh: 3 jam bersih → 30
   menit pertama (0,5 jam × 1) + 2,5 jam sisanya (× 1,5) = **4,25 jam
   kotor**. Nilai ini yang ditampilkan di Dashboard dan kolom export sebagai
   dasar perhitungan gaji lembur.

Kalau jam istirahat atau rumus pengali ini berubah di kemudian hari, cukup
ubah `BREAK_WINDOWS` dan `grossPayMinutes()` di `lib/utils.ts` — semua
tempat yang menampilkan durasi (form, dashboard, export) otomatis ikut
menyesuaikan karena semuanya memanggil fungsi yang sama.

## Teknologi

- [Next.js](https://nextjs.org/) (App Router) + TypeScript + Tailwind CSS
- [Turso](https://turso.tech/) (database SQLite terdistribusi, via `@libsql/client`)
  sebagai penyimpanan data. Saat `TURSO_DATABASE_URL` tidak diatur, aplikasi
  otomatis memakai file SQLite lokal di `data/app.db` — cocok untuk
  development di komputer sendiri tanpa perlu setup apa pun.
- Autentikasi berbasis sesi (cookie httpOnly) dengan password di-hash
  menggunakan `bcryptjs`.
- Export Excel menggunakan `xlsx` (SheetJS).

## Menjalankan Secara Lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`. Tanpa konfigurasi tambahan, aplikasi otomatis
memakai file SQLite lokal (`data/app.db`) dan membuat akun admin default:

- **Username:** `admin`
- **Password:** `admin123`

> ⚠️ **Segera login dan ganti password default ini** melalui menu "Akun" di
> pojok kanan atas setelah login pertama kali.

## Build untuk Produksi

```bash
npm run build
npm run start
```

## 🚀 Panduan Deploy Gratis (Vercel + Turso)

Cara ini **100% gratis tanpa kartu kredit**, dan data pengajuan lembur aman
tersimpan permanen (tidak hilang saat aplikasi di-redeploy). Ada dua bagian:
menyiapkan database (Turso), lalu men-deploy aplikasi (Vercel).

### Bagian 1 — Buat Database Gratis di Turso (lewat browser, tanpa CLI)

1. Buka [app.turso.tech](https://app.turso.tech/) dan daftar/login (bisa
   pakai akun GitHub, tanpa kartu kredit).
2. Di dashboard, klik tombol **Create Database** (atau **New Database**).
3. Beri nama bebas, misalnya `spl-form`, pilih region terdekat (mis.
   Singapore), lalu klik **Create**.
4. Setelah database dibuat, buka halaman detail database tersebut. Cari
   bagian **URL** — salin nilainya (berbentuk `libsql://spl-form-namamu.turso.io`).
5. Masih di halaman yang sama, cari tombol **Create Token** (atau
   **Generate Token**). Klik, lalu salin token yang muncul (teks panjang
   diawali `eyJ...`). Token ini hanya ditampilkan sekali, jadi simpan dulu
   di catatan sementara sebelum menutup halaman.

Sekarang kamu punya 2 nilai yang dibutuhkan: **URL database** dan
**auth token**.

### Bagian 2 — Deploy ke Vercel

1. Pastikan kode sudah ada di repository GitHub kamu (repo ini sudah siap).
2. Buka [vercel.com](https://vercel.com/) dan daftar/login **pakai akun
   GitHub** (gratis, tanpa kartu kredit untuk paket Hobby).
3. Klik **Add New → Project**, lalu pilih repository `spl-form` ini.
4. Sebelum klik Deploy, buka bagian **Environment Variables** dan tambahkan:

   | Name | Value |
   |---|---|
   | `TURSO_DATABASE_URL` | URL dari langkah 4 Bagian 1 (`libsql://...`) |
   | `TURSO_AUTH_TOKEN` | Token dari langkah 5 Bagian 1 |

5. Klik **Deploy**. Tunggu 1-2 menit sampai selesai.
6. Buka domain yang diberikan Vercel (contoh: `spl-form.vercel.app`), login
   dengan `admin` / `admin123`, lalu **segera ganti password** dan buat akun
   untuk petugas lapangan di menu **Kelola User**.

Selesai — aplikasi sudah online, gratis selamanya, dan data tersimpan aman di
Turso meskipun Vercel me-redeploy atau me-restart aplikasi kapan pun.

### Update Aplikasi di Kemudian Hari

Setiap kali ada perubahan kode dan di-`git push` ke branch utama, Vercel
otomatis build & deploy ulang secara otomatis — tidak perlu langkah manual.

### Catatan Batas Gratis

- **Turso free tier**: 500 database, total 5 GB penyimpanan, 1 miliar baris
  dibaca/bulan — jauh lebih dari cukup untuk pencatatan lembur internal.
- **Vercel Hobby**: gratis untuk penggunaan personal/internal seperti ini,
  tanpa batas waktu.
- Tidak ada kartu kredit yang diminta di kedua layanan untuk tier gratis ini.

## Alur Penggunaan

1. Admin login, lalu ke menu **Kelola Karyawan** untuk memastikan database
   karyawan sudah lengkap (30 karyawan awal sudah otomatis terisi dari data
   yang diberikan saat setup — tambah/edit sesuai kebutuhan).
2. Admin ke menu **Kelola User** untuk membuat akun bagi setiap petugas
   lapangan (username + password), lalu membagikan kredensial tersebut ke
   masing-masing orang.
3. Admin ke menu **Pengaturan** untuk mengatur batas waktu (cut off)
   pengisian — masing-masing untuk Senin–Jumat, Sabtu, dan Minggu — lalu
   pastikan toggle "Aktifkan form" menyala.
4. Petugas lapangan (atau foreman) login, lalu mengisi form lembur di
   halaman **Form Lembur**: pilih tanggal, pilih nama dari database
   (atau ketik bebas), pekerjaan, serta jam mulai & jam selesai.
5. Admin meninjau pengajuan di menu **Pengajuan** — **Setujui** atau
   **Tolak** (dengan alasan) satu per satu.
6. Admin memantau ringkasan jam lembur per orang per bulan (yang sudah
   disetujui) di menu **Dashboard**, dan mengekspor ke Excel — baik rekap
   biasa maupun **format harian** yang meniru template internal — untuk
   keperluan rekap/payroll.

## 🛠️ Cara Melakukan Perubahan

Panduan singkat untuk perubahan-perubahan yang paling sering dibutuhkan.
Semua perubahan kode perlu di-`git push` ke branch yang sudah tersambung ke
Vercel agar otomatis ter-deploy ke situs `.vercel.app` yang sudah online.

### Perubahan yang **tidak perlu ubah kode** (langsung dari halaman admin)

- **Ubah jam cut off harian** → menu **Pengaturan**.
- **Buka/tutup form secara manual** → toggle di menu **Pengaturan**.
- **Tambah/edit/hapus data karyawan** (untuk dropdown nama) → menu
  **Kelola Karyawan**, satu-satu atau tempel massal dari Excel.
- **Tambah/hapus/reset password user** → menu **Kelola User**.
- **Approve/reject pengajuan lembur** → menu **Pengajuan**.
- **Perbaiki data lembur yang salah input** → tombol **Edit** di menu
  **Pengajuan**.

### Perubahan yang perlu ubah kode

Struktur folder penting:

| Folder / File | Isinya |
|---|---|
| `app/form/page.tsx` + `components/OvertimeForm.tsx` | Halaman & form pengajuan lembur (user) |
| `components/EmployeePicker.tsx` | Dropdown pencarian nama karyawan (dengan fallback teks bebas) |
| `components/TimeSelect.tsx` / `TimeField.tsx` | Pemilih jam 24 jam (dipakai di semua form) |
| `app/admin/dashboard/page.tsx` | Dashboard analitik admin |
| `app/admin/submissions/` | Rekap, approve/reject, edit, dan export data lembur |
| `app/admin/employees/` | Kelola database karyawan |
| `app/admin/users/page.tsx` | Kelola user |
| `app/admin/settings/page.tsx` | Pengaturan cut off harian |
| `lib/actions.ts` | Semua logika submit form (Server Actions) |
| `lib/settings.ts` | Aturan cut off harian (Senin–Jumat/Sabtu/Minggu) |
| `lib/utils.ts` | Jam istirahat & rumus jam kotor (`BREAK_WINDOWS`, `grossPayMinutes`) |
| `lib/db.ts` | Skema database, migrasi kolom, & koneksi Turso |
| `lib/employee-seed.ts` | Data awal 30 karyawan (hanya dipakai sekali saat database masih kosong) |
| `app/globals.css` + `tailwind.config.ts` | Warna, gaya kartu, tombol, animasi, dsb. |

Contoh perubahan umum:

1. **Ganti warna/tampilan** — edit variabel warna di bagian atas
   `app/globals.css` (mis. `--color-accent` untuk warna aksen biru), lalu
   simpan. Semua tombol/kartu di seluruh halaman otomatis ikut berubah
   karena memakai kelas yang sama (`.btn-primary`, `.card`, dst).
2. **Tambah kolom baru di form lembur** — tambahkan field di
   `components/OvertimeForm.tsx`, lalu proses nilainya di
   `createSubmissionAction` (`lib/actions.ts`), dan tambahkan kolomnya di
   tabel `submissions` pada `lib/db.ts` (bagian `CREATE TABLE`).
3. **Tambah field pengaturan baru** — tambahkan key baru di
   `lib/settings.ts` (`AppSettings` type + default value), lalu tambahkan
   input-nya di `app/admin/settings/page.tsx` dan proses di
   `updateSettingsAction`.

### Menguji perubahan sebelum di-push

```bash
npm install   # sekali saja / setelah menambah dependency baru
npm run dev
```

Buka `http://localhost:3000` — aplikasi otomatis memakai database SQLite
lokal (`data/app.db`) terpisah dari database Turso produksi, jadi aman untuk
coba-coba tanpa mengubah data asli.

### Menerapkan perubahan ke situs yang sudah online

```bash
git add -A
git commit -m "Deskripsi singkat perubahan"
git push
```

Vercel otomatis mendeteksi push ini dan mem-build ulang situs — biasanya
selesai dalam 1-2 menit, tanpa langkah manual apa pun. Jika ingin
menjalankan perintah git tapi belum familiar, bisa juga minta bantuan
Claude langsung di sesi berikutnya untuk melakukan perubahan + push-nya.

## Troubleshooting: Data Lembur Terlihat Hilang

Jika di **Vercel** kamu pernah melihat data lembur seperti hilang setelah
beberapa saat, penyebab paling umum: environment variable `TURSO_DATABASE_URL`
belum diset di project Vercel (Production), sehingga aplikasi diam-diam
memakai file SQLite sementara yang tidak permanen antar-instance server.
Aplikasi sekarang otomatis menampilkan **banner peringatan merah** di semua
halaman admin bila ini terjadi — kalau muncul, cek kembali langkah
[Bagian 2 — Deploy ke Vercel](#bagian-2--deploy-ke-vercel) di atas (pastikan
`TURSO_DATABASE_URL` & `TURSO_AUTH_TOKEN` terisi di Production), lalu
redeploy. Selain itu, sejak nama sekarang dipilih dari database karyawan
(bukan diketik manual), jam lembur satu orang juga tidak akan lagi
"tercecer" akibat variasi penulisan nama (typo/kapitalisasi) — dashboard
mengelompokkan berdasarkan NIK saat tersedia.

## Rencana Pengembangan Selanjutnya

- Notifikasi (email/WhatsApp) saat mendekati batas waktu cut off, atau saat
  pengajuan disetujui/ditolak.
- Approval berjenjang (lebih dari satu level persetujuan sebelum masuk
  rekap final).
- Impor karyawan langsung dari file `.xlsx` (saat ini impor massal lewat
  paste teks tab-separated di menu Kelola Karyawan).
