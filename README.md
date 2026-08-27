# Form SPL — Pengajuan & Rekap Lembur

Aplikasi web untuk mengumpulkan pengajuan lembur dari tim lapangan, dengan panel
admin untuk mengatur batas waktu (cut off) pengisian, mengelola akun user, dan
mengekspor rekap data.

## Fitur

- **Login user & admin.** Setiap orang login dengan username/password yang
  dibuatkan oleh admin (tanpa registrasi mandiri).
- **Form pengajuan lembur** (untuk user lapangan):
  - Tanggal lembur bebas dipilih (bisa hari lain untuk rencana ke depan).
  - **Jam mulai otomatis** sesuai jam standar yang diatur admin (beda untuk
    hari biasa vs Sabtu) — user hanya perlu mengisi **jam selesai**.
  - Bisa mengisi **beberapa orang sekaligus untuk pekerjaan yang sama** (klik
    "+ Tambah Orang"), dan **beberapa pekerjaan berbeda dalam satu kali
    submit** (klik "+ Tambah Pekerjaan Lain") — cocok untuk foreman yang
    input lembur satu tim sekaligus.
  - Nama saat ini masih isian teks bebas — lihat bagian "Rencana
    pengembangan" di bawah untuk rencana dropdown Nama/NIK.
- **Riwayat pengajuan** milik user sendiri, dengan opsi hapus.
- **Panel admin:**
  - **Dashboard**: kartu ringkasan (total jam lembur, total pengajuan, jumlah
    orang aktif, rata-rata jam/orang) beserta perbandingan ke bulan lalu,
    ranking jam lembur per orang, dan tren harian — untuk memantau siapa
    lembur berapa lama setiap bulan.
  - **Pengajuan**: rekap semua pengajuan lembur (bisa difilter berdasarkan
    rentang tanggal), **edit** data lembur secara manual, dan ekspor ke file
    Excel (`.xlsx`).
  - **Kelola User**: admin membuat username & password untuk user lapangan
    (atau admin lain), reset password, dan menghapus user.
  - **Pengaturan**: jam mulai lembur standar + batas waktu (cut off)
    pengisian, masing-masing terpisah untuk **hari biasa** dan **Sabtu**,
    plus tombol darurat untuk menutup form secara manual kapan pun.
- **Ganti password** mandiri untuk setiap user yang sudah login.
- Tampilan bergaya kartu, terinspirasi Apple, dengan header kaca (frosted
  glass) dan aksen biru.

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

1. Admin login, lalu ke menu **Kelola User** untuk membuat akun bagi setiap
   petugas lapangan (username + password), lalu membagikan kredensial
   tersebut ke masing-masing orang.
2. Admin ke menu **Pengaturan** untuk mengatur jam mulai lembur standar dan
   batas waktu (cut off) pengisian — masing-masing untuk hari biasa dan
   Sabtu — lalu pastikan toggle "Aktifkan form" menyala.
3. Petugas lapangan (atau foreman) login, lalu mengisi form lembur di
   halaman **Form Lembur**: pilih tanggal, isi satu atau beberapa nama per
   pekerjaan, dan jam selesai (jam mulai otomatis terisi).
4. Admin memantau ringkasan jam lembur per orang per bulan di menu
   **Dashboard**, melihat/mengedit data mentah di menu **Pengajuan**, dan
   mengekspor ke Excel untuk keperluan rekap/payroll.

## 🛠️ Cara Melakukan Perubahan

Panduan singkat untuk perubahan-perubahan yang paling sering dibutuhkan.
Semua perubahan kode perlu di-`git push` ke branch yang sudah tersambung ke
Vercel agar otomatis ter-deploy ke situs `.vercel.app` yang sudah online.

### Perubahan yang **tidak perlu ubah kode** (langsung dari halaman admin)

- **Ubah jam mulai lembur standar / jam cut off** → menu **Pengaturan**.
- **Buka/tutup form secara manual** → toggle di menu **Pengaturan**.
- **Tambah/hapus/reset password user** → menu **Kelola User**.
- **Perbaiki data lembur yang salah input** → tombol **Edit** di menu
  **Pengajuan**.

### Perubahan yang perlu ubah kode

Struktur folder penting:

| Folder / File | Isinya |
|---|---|
| `app/form/page.tsx` + `components/OvertimeForm.tsx` | Halaman & form pengajuan lembur (user) |
| `app/admin/dashboard/page.tsx` | Dashboard analitik admin |
| `app/admin/submissions/` | Rekap, edit, dan export data lembur |
| `app/admin/users/page.tsx` | Kelola user |
| `app/admin/settings/page.tsx` | Pengaturan jam & cut off |
| `lib/actions.ts` | Semua logika submit form (Server Actions) |
| `lib/settings.ts` | Aturan jam mulai standar & cut off |
| `lib/db.ts` | Skema database & koneksi Turso |
| `app/globals.css` + `tailwind.config.ts` | Warna, gaya kartu, tombol, dsb. |

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

## Rencana Pengembangan Selanjutnya

- Mengganti isian "Nama" pada form dari teks bebas menjadi dropdown yang
  bersumber dari data master karyawan (Nama, NIK, dan data lain), begitu
  data tersebut (misalnya dalam bentuk CSV) sudah tersedia untuk diimpor.
- Notifikasi (email/WhatsApp) saat mendekati batas waktu cut off.
- Approval berjenjang (atasan menyetujui sebelum masuk rekap final).
