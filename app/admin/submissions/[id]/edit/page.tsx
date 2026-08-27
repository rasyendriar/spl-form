import { notFound } from 'next/navigation';
import Link from 'next/link';
import { queryOne } from '@/lib/db';
import { updateSubmissionAction } from '@/lib/actions';
import TimeField from '@/components/TimeField';

const ERROR_MESSAGES: Record<string, string> = {
  invalid: 'Semua kolom wajib diisi dengan benar (jam format HH:MM).',
};

type Submission = {
  id: number;
  nik: string | null;
  nama: string;
  tanggal_lembur: string;
  jam_mulai: string;
  jam_selesai: string;
  pekerjaan: string;
  piket: number | null;
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
    `SELECT id, nik, nama, tanggal_lembur, jam_mulai, jam_selesai, pekerjaan, piket FROM submissions WHERE id = ?`,
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

      <div className="card p-4 sm:p-6">
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
            <label className="label" htmlFor="nik">
              NIK / No. Reg (opsional)
            </label>
            <input
              id="nik"
              name="nik"
              type="text"
              defaultValue={submission!.nik ?? ''}
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

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Jam Mulai</label>
              <TimeField name="jam_mulai" defaultValue={submission!.jam_mulai} required />
            </div>
            <div>
              <label className="label">Jam Selesai</label>
              <TimeField name="jam_selesai" defaultValue={submission!.jam_selesai} required />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="piket">
              Piket Sabtu (khusus posisi Staff)
            </label>
            <select
              id="piket"
              name="piket"
              className="input"
              defaultValue={submission!.piket === 1 ? 'ya' : submission!.piket === 0 ? 'tidak' : 'auto'}
            >
              <option value="auto">Tidak berlaku (bukan Sabtu / bukan Staff)</option>
              <option value="ya">Piket (1 jam × 1,5, sisanya × 2)</option>
              <option value="tidak">Tidak piket (semua jam × 2, seperti Minggu)</option>
            </select>
            <p className="text-xs text-[color:var(--color-ink-muted)] mt-1">
              Hanya dikonsultasi sistem jika Tanggal Lembur di atas jatuh pada hari Sabtu.
            </p>
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
