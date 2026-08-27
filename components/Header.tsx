import Link from 'next/link';
import { SessionUser } from '@/lib/session';
import { logoutAction } from '@/lib/actions';

export default function Header({
  user,
  nav,
}: {
  user: SessionUser;
  nav?: { href: string; label: string }[];
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between gap-4">
        <div>
          <Link href="/" className="text-lg font-bold text-brand-600">
            Form SPL
          </Link>
          <p className="text-xs text-slate-500">Pengajuan &amp; Rekap Lembur</p>
        </div>

        {nav && nav.length > 0 && (
          <nav className="hidden sm:flex items-center gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium leading-tight">{user.full_name}</p>
            <p className="text-xs text-slate-500 leading-tight">
              {user.role === 'admin' ? 'Admin' : 'Petugas Lapangan'}
            </p>
          </div>
          <Link href="/account" className="btn-secondary text-xs">
            Akun
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="btn-secondary text-xs">
              Keluar
            </button>
          </form>
        </div>
      </div>

      {nav && nav.length > 0 && (
        <nav className="flex sm:hidden gap-1 px-4 pb-3 overflow-x-auto">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
