import { redirect } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { getSession } from '@/lib/session';
import { isOnVercel, isUsingFallbackDb } from '@/lib/db';
import Header from '@/components/Header';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/submissions', label: 'Pengajuan' },
  { href: '/admin/employees', label: 'Kelola Karyawan' },
  { href: '/admin/users', label: 'Kelola User' },
  { href: '/admin/settings', label: 'Pengaturan' },
  { href: '/form', label: 'Isi Form (uji coba)' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'admin') redirect('/form');

  const showDbWarning = isUsingFallbackDb && isOnVercel;

  return (
    <div>
      <Header user={session} nav={NAV} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        {showDbWarning && (
          <div className="alert-error flex items-start gap-2 mb-6">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Database Turso belum terkonfigurasi di server ini.</p>
              <p className="mt-0.5">
                Aplikasi sedang memakai file SQLite sementara yang{' '}
                <strong>tidak tersimpan permanen</strong> — data bisa terlihat hilang setelah
                beberapa saat. Tambahkan environment variable{' '}
                <code className="font-mono bg-black/5 px-1 rounded">TURSO_DATABASE_URL</code> dan{' '}
                <code className="font-mono bg-black/5 px-1 rounded">TURSO_AUTH_TOKEN</code> di
                pengaturan project Vercel (Production), lalu redeploy.
              </p>
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
