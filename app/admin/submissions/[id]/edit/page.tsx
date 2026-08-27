import { notFound } from 'next/navigation';
import Link from 'next/link';
import { queryOne } from '@/lib/db';
import { updateSubmissionAction } from '@/lib/actions';

const ERROR_MESSAGES: Record<string, string> = {
  invalid: 'Semua kolom wajib diisi dengan benar (jam format HH:MM).',
};

type Submission = {
  id: number;
  nama: string;
  tanggal_lembur: string;
  jam_mulai: string;
  jam_selesai: string;
  pekerjaan: string;
};

export default async function EditSubmissionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  const submission = await queryOne<Submission>(
    `SELECT id, nama, tanggal_lembur, jam_mulai, jam_selesai, pekerjaan FROM submissions WHERE id = ?`,
    [Number(id)]
  );

  if (!submission) notFound();

  const error = query.error ? ERROR_MESSAGES[query.error] : undefined;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Pengajuan Lembur</h1>
        <p className="text-sm text-[color:var(--color-ink-secondary)] mt-1">
          Ubah data pengajuan lembur ini secara manual.
        </p>
      </div>

      {error && <p className="alert-error">{error}</p>}

      <div className="card p-6">
        <form action={updateSubmissionAction} className="space-y-4">
          <input type="hidden" name="id" value={submission!.id} />

          <div>
            <label className="label" htmlFor="nama">
              Nama
            </label>
            <input
              id="nama"
              name="nama"
              type="text"
              required
              defaultValue={submission!.nama}
              className="input"
            />
          </div>

          <div>
            <label className="label" htmlFor="tanggal_lembur">
              Tanggal Lembur
            </label>
            <input
              id="tanggal_lembur"
              name="tanggal_lembur"
              type="date"
              required
              defaultValue={submission!.tanggal_lembur}
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="jam_mulai">
                Jam Mulai
              </label>
              <input
                id="jam_mulai"
                name="jam_mulai"
                type="time"
                required
                defaultValue={submission!.jam_mulai}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="jam_selesai">
                Jam Selesai
              </label>
              <input
                id="jam_selesai"
                name="jam_selesai"
                type="time"
                required
                defaultValue={submission!.jam_selesai}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="pekerjaan">
              Pekerjaan
            </label>
            <textarea
              id="pekerjaan"
              name="pekerjaan"
              required
              rows={3}
              defaultValue={submission!.pekerjaan}
              className="input"
            />
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn-primary">
              Simpan Perubahan
            </button>
            <Link href="/admin/submissions" className="btn-secondary">
              Batal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
