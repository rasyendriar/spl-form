# Form SPL — Pengajuan & Rekap Lembur

Aplikasi web untuk mengumpulkan pengajuan lembur dari tim lapangan, dengan panel
admin untuk mengatur batas waktu (cut off) pengisian, mengelola akun user, dan
mengekspor rekap data.

## Fitur

- **Login user & admin.** Setiap orang login dengan username/password yang
  dibuatkan oleh admin (tanpa registrasi mandiri).
- **Form pengajuan lembur** (untuk user lapangan): Nama, tanggal lembur (bisa
  memilih hari lain untuk rencana ke depan), jam mulai & jam selesai, serta
  keterangan pekerjaan. Nama saat ini masih isian teks bebas — lihat bagian
  "Rencana pengembangan" di bawah untuk rencana dropdown Nama/NIK.
- **Riwayat pengajuan** milik user sendiri, dengan opsi hapus.
- **Panel admin:**
  - **Pengajuan**: rekap semua pengajuan lembur, bisa difilter berdasarkan
    rentang tanggal, dan diekspor ke file Excel (`.xlsx`).
  - **Kelola User**: admin membuat username & password untuk user lapangan
    (atau admin lain), reset password, dan menghapus user.
  - **Pengaturan**: admin mengatur toggle buka/tutup form, serta batas waktu
    (cut off) otomatis kapan form akan tertutup.
- **Ganti password** mandiri untuk setiap user yang sudah login.

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

### Bagian 1 — Buat Database Gratis di Turso

1. Buka [turso.tech](https://turso.tech/) dan daftar akun gratis (bisa pakai
   akun GitHub, tanpa kartu kredit).
2. Install Turso CLI di komputer kamu:
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   ```
   (Pengguna Windows: ikuti petunjuk instalasi di [docs.turso.tech](https://docs.turso.tech/cli/installation).)
3. Login dari terminal:
   ```bash
   turso auth login
   ```
4. Buat database baru (bebas ganti nama `spl-form` sesuai selera):
   ```bash
   turso db create spl-form
   ```
5. Ambil connection URL-nya:
   ```bash
   turso db show spl-form --url
   ```
   Hasilnya berbentuk `libsql://spl-form-namamu.turso.io` — simpan ini.
6. Buat token akses:
   ```bash
   turso db tokens create spl-form
   ```
   Simpan token yang muncul (panjang, diawali `eyJ...`).

> Alternatif: semua langkah di atas juga bisa dilakukan lewat dashboard web
> Turso tanpa CLI, jika kamu lebih suka klik-klik di browser.

### Bagian 2 — Deploy ke Vercel

1. Pastikan kode sudah ada di repository GitHub kamu (repo ini sudah siap).
2. Buka [vercel.com](https://vercel.com/) dan daftar/login **pakai akun
   GitHub** (gratis, tanpa kartu kredit untuk paket Hobby).
3. Klik **Add New → Project**, lalu pilih repository `spl-form` ini.
4. Sebelum klik Deploy, buka bagian **Environment Variables** dan tambahkan:

   | Name | Value |
   |---|---|
   | `TURSO_DATABASE_URL` | URL dari langkah 5 Bagian 1 (`libsql://...`) |
   | `TURSO_AUTH_TOKEN` | Token dari langkah 6 Bagian 1 |

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
2. Admin ke menu **Pengaturan** untuk memastikan form dalam status
   "TERBUKA", dan (opsional) menentukan batas waktu otomatis pengisian.
3. Petugas lapangan login dengan akun yang diberikan, lalu mengisi form
   lembur di halaman **Form Lembur**.
4. Admin memantau seluruh pengajuan di menu **Pengajuan**, memfilter
   berdasarkan tanggal, dan mengekspor ke Excel untuk keperluan rekap/payroll.

## Rencana Pengembangan Selanjutnya

- Mengganti isian "Nama" pada form dari teks bebas menjadi dropdown yang
  bersumber dari data master karyawan (Nama, NIK, dan data lain), begitu
  data tersebut (misalnya dalam bentuk CSV) sudah tersedia untuk diimpor.
- Notifikasi (email/WhatsApp) saat mendekati batas waktu cut off.
- Approval berjenjang (atasan menyetujui sebelum masuk rekap final).
