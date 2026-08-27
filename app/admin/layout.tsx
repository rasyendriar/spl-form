import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import Header from '@/components/Header';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/submissions', label: 'Pengajuan' },
  { href: '/admin/users', label: 'Kelola User' },
  { href: '/admin/settings', label: 'Pengaturan' },
  { href: '/form', label: 'Isi Form (uji coba)' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'admin') redirect('/form');

  return (
    <div>
      <Header user={session} nav={NAV} />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
