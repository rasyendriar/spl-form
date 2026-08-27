import { notFound } from 'next/navigation';
import Link from 'next/link';
import { queryOne } from '@/lib/db';
import { updateEmployeeAction } from '@/lib/actions';

const ERROR_MESSAGES: Record<string, string> = {
  invalid: 'NIK dan Nama wajib diisi.',
  exists: 'NIK sudah dipakai karyawan lain.',
};

type Employee = {
  id: number;
  nik: string;
  nama: string;
  section: string;
  position: string;
  grup: string;
};

export default async function EditEmployeePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  const employee = await queryOne<Employee>(
    `SELECT id, nik, nama, section, position, grup FROM employees WHERE id = ?`,
    [Number(id)]
  );

  if (!employee) notFound();

  const error = query.error ? ERROR_MESSAGES[query.error] : undefined;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Karyawan</h1>
        <p className="text-sm text-[color:var(--color-ink-secondary)] mt-1">
          Ubah data karyawan ini.
        </p>
      </div>

      {error && <p className="alert-error">{error}</p>}

      <div className="card p-6">
        <form action={updateEmployeeAction} className="space-y-4">
          <input type="hidden" name="id" value={employee!.id} />

          <div>
            <label className="label" htmlFor="nik">
              NIK / No. Reg
            </label>
            <input id="nik" name="nik" type="text" required defaultValue={employee!.nik} className="input" />
          </div>

          <div>
            <label className="label" htmlFor="nama">
              Nama
            </label>
            <input id="nama" name="nama" type="text" required defaultValue={employee!.nama} className="input" />
          </div>

          <div>
            <label className="label" htmlFor="section">
              Section
            </label>
            <input id="section" name="section" type="text" defaultValue={employee!.section} className="input" />
          </div>

          <div>
            <label className="label" htmlFor="position">
              Posisi
            </label>
            <input id="position" name="position" type="text" defaultValue={employee!.position} className="input" />
          </div>

          <div>
            <label className="label" htmlFor="grup">
              Grup
            </label>
            <input id="grup" name="grup" type="text" defaultValue={employee!.grup} className="input" />
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn-primary">
              Simpan Perubahan
            </button>
            <Link href="/admin/employees" className="btn-secondary">
              Batal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
