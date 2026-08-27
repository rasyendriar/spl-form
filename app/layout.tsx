import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Form SPL - Pengajuan Lembur',
  description: 'Aplikasi pengajuan dan rekap lembur untuk tim lapangan',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
