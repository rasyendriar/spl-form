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
- SQLite (via `better-sqlite3`) sebagai penyimpanan data — file database
  tersimpan di `data/app.db`, dibuat otomatis saat aplikasi pertama kali
  dijalankan.
- Autentikasi berbasis sesi (cookie httpOnly) dengan password di-hash
  menggunakan `bcryptjs`.
- Export Excel menggunakan `xlsx` (SheetJS).

## Menjalankan Secara Lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`. Saat pertama kali dijalankan, aplikasi otomatis
membuat akun admin default:

- **Username:** `admin`
- **Password:** `admin123`

> ⚠️ **Segera login dan ganti password default ini** melalui menu "Akun" di
> pojok kanan atas setelah login pertama kali.

## Build untuk Produksi

```bash
npm run build
npm run start
```

## Catatan Deployment

Aplikasi ini menyimpan data dalam file SQLite lokal (`data/app.db`), sehingga:

- Harus dijalankan di server Node.js yang persisten (bukan platform
  serverless/edge tanpa filesystem persisten), misalnya VPS, container
  Docker dengan volume, atau layanan seperti Railway/Render.
- Pastikan folder `data/` dipasang di **persistent volume** agar data tidak
  hilang saat aplikasi di-redeploy atau container di-restart.
- Lakukan backup berkala terhadap file `data/app.db`.

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
