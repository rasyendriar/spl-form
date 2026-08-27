import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getSettings, isFormOpen } from '@/lib/settings';
import { createSubmissionAction, deleteSubmissionAction } from '@/lib/actions';
import { formatDateID, formatDateTimeID, formatDuration, todayInputValue } from '@/lib/utils';
import { queryAll } from '@/lib/db';
import Header from '@/components/Header';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';

const ERROR_MESSAGES: Record<string, string> = {
  closed: 'Pengisian form sedang ditutup. Silakan hubungi admin.',
  empty: 'Semua kolom wajib diisi.',
};

type Submission = {
  id: number;
  nama: string;
  tanggal_lembur: string;
  jam_mulai: string;
  jam_selesai: string;
  pekerjaan: string;
  created_at: string;
};

export default async function FormPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const params = await searchParams;
  const settings = await getSettings();
  const open = isFormOpen(settings);

  const submissions = await queryAll<Submission>(
    `SELECT id, nama, tanggal_lembur, jam_mulai, jam_selesai, pekerjaan, created_at
     FROM submissions WHERE user_id = ?
     ORDER BY tanggal_lembur DESC, id DESC`,
    [session!.id]
  );

  const nav =
    session!.role === 'admin'
      ? [
          { href: '/admin/submissions', label: 'Pengajuan' },
          { href: '/admin/users', label: 'Kelola User' },
          { href: '/admin/settings', label: 'Pengaturan' },
        ]
      : [];

  const error = params.error ? ERROR_MESSAGES[params.error] : undefined;

  return (
    <div>
      <Header user={session!} nav={nav} />
      <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold">Ajukan Lembur</h1>
          <p className="text-sm text-slate-500">
            Isi data lembur kamu. Bisa juga untuk merencanakan lembur di hari lain.
          </p>
        </div>

        {!open && (
          <p className="alert-info">
            Form pengisian lembur sedang <strong>ditutup</strong>
            {settings.cutoff_at ? ` (batas terakhir: ${formatDateTimeID(settings.cutoff_at)})` : ''}.
            Hubungi admin jika kamu perlu mengajukan lembur.
          </p>
        )}

        {error && <p className="alert-error">{error}</p>}
        {params.ok === '1' && <p className="alert-success">Pengajuan lembur berhasil disimpan.</p>}
        {params.ok === 'deleted' && <p className="alert-success">Pengajuan berhasil dihapus.</p>}

        <div className="card p-6">
          <form action={createSubmissionAction} className="space-y-4">
            <div>
              <label className="label" htmlFor="nama">
                Nama
              </label>
              <input
                id="nama"
                name="nama"
                type="text"
                required
                disabled={!open}
                defaultValue={session!.full_name}
                className="input"
                placeholder="Nama lengkap"
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
                disabled={!open}
                defaultValue={todayInputValue()}
                className="input"
              />
              <p className="text-xs text-slate-400 mt-1">
                Bisa pilih tanggal lain jika ini rencana lembur di hari mendatang.
              </p>
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
                  disabled={!open}
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
                  disabled={!open}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="pekerjaan">
                Pekerjaan / Keperluan Lembur
              </label>
              <textarea
                id="pekerjaan"
                name="pekerjaan"
                required
                disabled={!open}
                rows={3}
                className="input"
                placeholder="Contoh: Perbaikan mesin produksi line 2"
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={!open}>
              Simpan Pengajuan
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Riwayat Pengajuan Saya</h2>
          {submissions.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada pengajuan lembur.</p>
          ) : (
            <div className="space-y-3">
              {submissions.map((s) => (
                <div key={s.id} className="card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{formatDateID(s.tanggal_lembur)}</p>
                      <p className="text-sm text-slate-600">
                        {s.jam_mulai} - {s.jam_selesai} ({formatDuration(s.jam_mulai, s.jam_selesai)})
                      </p>
                      <p className="text-sm text-slate-500 mt-1">{s.pekerjaan}</p>
                    </div>
                    <form action={deleteSubmissionAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <ConfirmSubmitButton
                        confirmMessage="Hapus pengajuan ini?"
                        className="btn-danger text-xs"
                      >
                        Hapus
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
