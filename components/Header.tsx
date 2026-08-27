import Link from 'next/link';
import { SessionUser } from '@/lib/session';
import { logoutAction } from '@/lib/actions';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '');
  return letters.join('') || '?';
}

export default function Header({
  user,
  nav,
}: {
  user: SessionUser;
  nav?: { href: string; label: string }[];
}) {
  return (
    <header className="glass-header">
      <div className="mx-auto max-w-6xl px-4 py-3.5 flex items-center justify-between gap-4">
        <div>
          <Link href="/" className="text-[17px] font-semibold tracking-tight text-[color:var(--color-ink)]">
            Form SPL
          </Link>
          <p className="text-[11px] text-[color:var(--color-ink-muted)] leading-tight">
            Pengajuan &amp; Rekap Lembur
          </p>
        </div>

        {nav && nav.length > 0 && (
          <nav className="hidden md:flex items-center gap-1 bg-black/[0.035] rounded-full p-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3.5 py-1.5 text-[13px] font-medium text-[color:var(--color-ink-secondary)] hover:bg-white hover:text-[color:var(--color-ink)] hover:shadow-sm transition"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-[color:var(--color-accent)] text-white text-xs font-semibold flex items-center justify-center">
              {initials(user.full_name)}
            </div>
            <div className="text-right leading-tight">
              <p className="text-sm font-medium">{user.full_name}</p>
              <p className="text-[11px] text-[color:var(--color-ink-muted)]">
                {user.role === 'admin' ? 'Admin' : 'Petugas Lapangan'}
              </p>
            </div>
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
        <nav className="flex md:hidden gap-1 px-4 pb-3 overflow-x-auto">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium bg-black/[0.04] text-[color:var(--color-ink-secondary)] hover:bg-black/[0.08]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
