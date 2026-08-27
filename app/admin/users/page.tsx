import { queryAll } from '@/lib/db';
import { createUserAction, deleteUserAction, resetPasswordAction } from '@/lib/actions';
import { formatDateTimeID } from '@/lib/utils';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';

const ERROR_MESSAGES: Record<string, string> = {
  invalid: 'Username, nama, dan password (min. 6 karakter) wajib diisi.',
  exists: 'Username sudah digunakan, pilih username lain.',
  invalid_reset: 'Password baru minimal 6 karakter.',
  self_delete: 'Kamu tidak bisa menghapus akunmu sendiri.',
  last_admin: 'Tidak bisa menghapus admin terakhir.',
};

const OK_MESSAGES: Record<string, string> = {
  created: 'User baru berhasil dibuat.',
  reset: 'Password berhasil direset.',
  deleted: 'User berhasil dihapus.',
};

type User = {
  id: number;
  username: string;
  full_name: string;
  role: 'admin' | 'user';
  created_at: string;
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const params = await searchParams;
  const users = await queryAll<User>(
    `SELECT id, username, full_name, role, created_at FROM users ORDER BY id ASC`
  );

  const error = params.error ? ERROR_MESSAGES[params.error] : undefined;
  const ok = params.ok ? OK_MESSAGES[params.ok] : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Kelola User</h1>
        <p className="text-sm text-slate-500">
          Buat akun login untuk petugas lapangan, lalu bagikan username &amp; password ke mereka.
        </p>
      </div>

      {error && <p className="alert-error">{error}</p>}
      {ok && <p className="alert-success">{ok}</p>}

      <div className="card p-6">
        <h2 className="font-semibold mb-4">Tambah User Baru</h2>
        <form action={createUserAction} className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="full_name">
              Nama Lengkap
            </label>
            <input id="full_name" name="full_name" type="text" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="username">
              Username
            </label>
            <input id="username" name="username" type="text" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="text"
              minLength={6}
              required
              className="input"
              placeholder="Minimal 6 karakter"
            />
          </div>
          <div>
            <label className="label" htmlFor="role">
              Peran
            </label>
            <select id="role" name="role" className="input" defaultValue="user">
              <option value="user">Petugas Lapangan</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary">
              Buat User
            </button>
          </div>
        </form>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium">Peran</th>
              <th className="px-4 py-3 font-medium">Dibuat</th>
              <th className="px-4 py-3 font-medium">Reset Password</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">{u.full_name}</td>
                <td className="px-4 py-3">{u.username}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      u.role === 'admin'
                        ? 'rounded-full bg-brand-50 text-brand-700 px-2 py-0.5 text-xs font-medium'
                        : 'rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-xs font-medium'
                    }
                  >
                    {u.role === 'admin' ? 'Admin' : 'Petugas Lapangan'}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                  {formatDateTimeID(u.created_at)}
                </td>
                <td className="px-4 py-3">
                  <form action={resetPasswordAction} className="flex gap-2">
                    <input type="hidden" name="id" value={u.id} />
                    <input
                      type="text"
                      name="new_password"
                      placeholder="Password baru"
                      minLength={6}
                      required
                      className="input text-xs py-1.5"
                    />
                    <button type="submit" className="btn-secondary text-xs whitespace-nowrap">
                      Reset
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={deleteUserAction}>
                    <input type="hidden" name="id" value={u.id} />
                    <ConfirmSubmitButton
                      confirmMessage={`Hapus user "${u.full_name}"?`}
                      className="btn-danger text-xs"
                    >
                      Hapus
                    </ConfirmSubmitButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
