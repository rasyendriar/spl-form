import Link from 'next/link';
import { Pencil, Plus, Upload, Users } from 'lucide-react';
import { queryAll } from '@/lib/db';
import { createEmployeeAction, deleteEmployeeAction, bulkImportEmployeesAction } from '@/lib/actions';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';

const ERROR_MESSAGES: Record<string, string> = {
  invalid: 'NIK dan Nama wajib diisi.',
  exists: 'NIK sudah terdaftar untuk karyawan lain.',
  empty_bulk: 'Tidak ada baris valid yang bisa diimpor.',
};

const OK_MESSAGES: Record<string, string> = {
  created: 'Karyawan baru berhasil ditambahkan.',
  updated: 'Data karyawan berhasil diperbarui.',
  deleted: 'Karyawan berhasil dihapus.',
};

type Employee = {
  id: number;
  nik: string;
  nama: string;
  section: string;
  position: string;
  grup: string;
};

export default async function AdminEmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string; count?: string; q?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? '').trim();

  const employees = await queryAll<Employee>(
    q
      ? `SELECT id, nik, nama, section, position, grup FROM employees
         WHERE nama LIKE ? OR nik LIKE ? OR section LIKE ?
         ORDER BY nama ASC`
      : `SELECT id, nik, nama, section, position, grup FROM employees ORDER BY nama ASC`,
    q ? [`%${q}%`, `%${q}%`, `%${q}%`] : []
  );

  const error = params.error ? ERROR_MESSAGES[params.error] : undefined;
  const ok =
    params.ok === 'imported'
      ? `${params.count ?? 0} baris karyawan berhasil diimpor/diperbarui.`
      : params.ok
        ? OK_MESSAGES[params.ok]
        : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2">
        <Users size={22} className="text-[color:var(--color-accent)] mt-0.5 shrink-0" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kelola Data Karyawan</h1>
          <p className="text-sm text-[color:var(--color-ink-secondary)]">
            Database karyawan ini dipakai sebagai pilihan nama di form lembur (dropdown), dan
            untuk mengisi kolom BARCODE saat export format harian.
          </p>
        </div>
      </div>

      {error && <p className="alert-error">{error}</p>}
      {ok && <p className="alert-success">{ok}</p>}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Plus size={16} /> Tambah Karyawan
          </h2>
          <form action={createEmployeeAction} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="nik">
                NIK / No. Reg
              </label>
              <input id="nik" name="nik" type="text" required className="input" />
            </div>
            <div>
              <label className="label" htmlFor="nama">
                Nama
              </label>
              <input id="nama" name="nama" type="text" required className="input" />
            </div>
            <div>
              <label className="label" htmlFor="section">
                Section
              </label>
              <input id="section" name="section" type="text" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="position">
                Posisi
              </label>
              <input id="position" name="position" type="text" className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="grup">
                Grup
              </label>
              <input id="grup" name="grup" type="text" className="input" />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary">
                Tambah Karyawan
              </button>
            </div>
          </form>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold mb-2 flex items-center gap-2">
            <Upload size={16} /> Impor Cepat (Paste dari Excel)
          </h2>
          <p className="text-sm text-[color:var(--color-ink-secondary)] mb-3">
            Salin baris dari Excel/Sheets (kolom: NIK, Nama, Section, Posisi, Grup — dipisah
            Tab) lalu tempel di bawah. NIK yang sudah ada otomatis diperbarui.
          </p>
          <form action={bulkImportEmployeesAction} className="space-y-3">
            <textarea
              name="bulk_data"
              rows={6}
              required
              placeholder={'SF22091307\tBasuki Rahmad\tMANAGER AT\tManager\tGrup'}
              className="input font-mono text-xs"
            />
            <button type="submit" className="btn-primary">
              Impor Data
            </button>
          </form>
        </div>
      </div>

      <form className="card p-4 flex flex-wrap items-end gap-4" method="get">
        <div className="flex-1 min-w-[200px]">
          <label className="label" htmlFor="q">
            Cari nama / NIK / section
          </label>
          <input id="q" name="q" type="text" defaultValue={q} className="input" />
        </div>
        <button type="submit" className="btn-secondary">
          Cari
        </button>
        {q && (
          <a href="/admin/employees" className="text-sm text-[color:var(--color-ink-secondary)] underline">
            Reset
          </a>
        )}
        <p className="text-sm text-[color:var(--color-ink-muted)] ml-auto">
          Total {employees.length} karyawan
        </p>
      </form>

      {/* Mobile: card list */}
      <div className="space-y-3 sm:hidden">
        {employees.length === 0 && (
          <p className="text-center text-sm text-[color:var(--color-ink-muted)] py-6">
            Tidak ada data karyawan.
          </p>
        )}
        {employees.map((e) => (
          <div key={e.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium truncate">{e.nama}</p>
                <p className="text-xs text-[color:var(--color-ink-muted)]">{e.nik}</p>
                <p className="text-xs text-[color:var(--color-ink-secondary)] mt-1">
                  {e.position} · {e.section}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link href={`/admin/employees/${e.id}/edit`} className="btn-secondary text-xs px-3">
                  <Pencil size={13} />
                </Link>
                <form action={deleteEmployeeAction}>
                  <input type="hidden" name="id" value={e.id} />
                  <ConfirmSubmitButton
                    confirmMessage={`Hapus karyawan "${e.nama}"?`}
                    className="btn-danger text-xs px-3"
                  >
                    Hapus
                  </ConfirmSubmitButton>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-black/[0.03] text-left text-[color:var(--color-ink-secondary)]">
            <tr>
              <th className="px-4 py-3 font-medium">NIK</th>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Section</th>
              <th className="px-4 py-3 font-medium">Posisi</th>
              <th className="px-4 py-3 font-medium">Grup</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {employees.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-[color:var(--color-ink-muted)]">
                  Tidak ada data karyawan.
                </td>
              </tr>
            )}
            {employees.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">{e.nik}</td>
                <td className="px-4 py-3">{e.nama}</td>
                <td className="px-4 py-3 text-[color:var(--color-ink-secondary)]">{e.section}</td>
                <td className="px-4 py-3 text-[color:var(--color-ink-secondary)]">{e.position}</td>
                <td className="px-4 py-3 text-[color:var(--color-ink-secondary)]">{e.grup}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <Link href={`/admin/employees/${e.id}/edit`} className="btn-secondary text-xs mr-2">
                    Edit
                  </Link>
                  <form action={deleteEmployeeAction} className="inline">
                    <input type="hidden" name="id" value={e.id} />
                    <ConfirmSubmitButton
                      confirmMessage={`Hapus karyawan "${e.nama}"?`}
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
