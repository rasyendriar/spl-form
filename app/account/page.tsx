import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { changePasswordAction } from '@/lib/actions';
import Header from '@/components/Header';

const ERROR_MESSAGES: Record<string, string> = {
  wrong_current: 'Password saat ini salah.',
  too_short: 'Password baru minimal 6 karakter.',
  mismatch: 'Konfirmasi password baru tidak cocok.',
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const nav =
    session!.role === 'admin'
      ? [
          { href: '/admin/dashboard', label: 'Dashboard' },
          { href: '/admin/submissions', label: 'Pengajuan' },
          { href: '/admin/employees', label: 'Kelola Karyawan' },
          { href: '/admin/users', label: 'Kelola User' },
          { href: '/admin/settings', label: 'Pengaturan' },
        ]
      : [{ href: '/form', label: 'Form Lembur' }];

  const params = await searchParams;
  const error = params.error ? ERROR_MESSAGES[params.error] : undefined;

  return (
    <div>
      <Header user={session!} nav={nav} />
      <main className="mx-auto max-w-sm px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-4">Ganti Password</h1>
        <div className="card p-4 sm:p-6">
          <form action={changePasswordAction} className="space-y-4">
            {error && <p className="alert-error">{error}</p>}
            {params.ok && <p className="alert-success">Password berhasil diubah.</p>}

            <div>
              <label className="label" htmlFor="current_password">
                Password Saat Ini
              </label>
              <input
                id="current_password"
                name="current_password"
                type="password"
                required
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="new_password">
                Password Baru
              </label>
              <input
                id="new_password"
                name="new_password"
                type="password"
                minLength={6}
                required
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="confirm_password">
                Konfirmasi Password Baru
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                minLength={6}
                required
                className="input"
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              Simpan Password
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
