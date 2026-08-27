import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { loginAction } from '@/lib/actions';

const ERROR_MESSAGES: Record<string, string> = {
  empty: 'Username dan password wajib diisi.',
  invalid: 'Username atau password salah.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) redirect('/');

  const params = await searchParams;
  const error = params.error ? ERROR_MESSAGES[params.error] : undefined;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--color-ink)]">
            Form SPL
          </h1>
          <p className="text-sm text-[color:var(--color-ink-secondary)] mt-1">
            Masuk untuk mengisi atau mengelola lembur
          </p>
        </div>

        <div className="card p-6">
          <form action={loginAction} className="space-y-4">
            {error && <p className="alert-error">{error}</p>}

            <div>
              <label className="label" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="input"
                placeholder="mis. budi.lapangan"
              />
            </div>

            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="input"
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className="btn-primary w-full">
              Masuk
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[color:var(--color-ink-muted)] mt-4">
          Lupa password? Hubungi admin untuk direset.
        </p>
      </div>
    </div>
  );
}
