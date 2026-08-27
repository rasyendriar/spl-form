import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getSettings, isFormOpen, todaysCutoffTime } from '@/lib/settings';
import { deleteSubmissionAction } from '@/lib/actions';
import { formatDateID, formatDuration, todayInputValue } from '@/lib/utils';
import { queryAll } from '@/lib/db';
import Header from '@/components/Header';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';
import OvertimeForm from '@/components/OvertimeForm';

const ERROR_MESSAGES: Record<string, string> = {
  closed: 'Pengisian form sedang ditutup untuk hari ini. Silakan hubungi admin.',
  empty: 'Isi tanggal, minimal satu nama, pekerjaan, dan jam selesai.',
  invalid_block: 'Setiap pekerjaan wajib punya nama, pekerjaan, dan jam selesai yang valid.',
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
  searchParams: Promise<{ error?: string; ok?: string; count?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const params = await searchParams;
  const settings = await getSettings();
  const open = isFormOpen(settings);
  const cutoffToday = todaysCutoffTime(settings);

  const submissions = await queryAll<Submission>(
    `SELECT id, nama, tanggal_lembur, jam_mulai, jam_selesai, pekerjaan, created_at
     FROM submissions WHERE user_id = ?
     ORDER BY tanggal_lembur DESC, id DESC`,
    [session!.id]
  );

  const nav =
    session!.role === 'admin'
      ? [
          { href: '/admin/dashboard', label: 'Dashboard' },
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
          <h1 className="text-2xl font-semibold tracking-tight">Ajukan Lembur</h1>
          <p className="text-sm text-[color:var(--color-ink-secondary)] mt-1">
            Isi data lembur kamu. Bisa juga untuk merencanakan lembur di hari lain, atau
            sekaligus untuk beberapa orang.
          </p>
        </div>

        {!open && (
          <p className="alert-info">
            Form pengisian lembur sedang <strong>ditutup</strong> untuk hari ini (batas jam{' '}
            {cutoffToday}). Hubungi admin jika kamu perlu mengajukan lembur.
          </p>
        )}

        {error && <p className="alert-error">{error}</p>}
        {params.ok === '1' && (
          <p className="alert-success">
            Pengajuan lembur berhasil disimpan{params.count ? ` (${params.count} entri)` : ''}.
          </p>
        )}
        {params.ok === 'deleted' && <p className="alert-success">Pengajuan berhasil dihapus.</p>}

        <div className="card p-6">
          <OvertimeForm
            defaultName={session!.full_name}
            defaultDate={todayInputValue()}
            weekdayStart={settings.weekday_start_time}
            saturdayStart={settings.saturday_start_time}
            disabled={!open}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Riwayat Pengajuan Saya</h2>
          {submissions.length === 0 ? (
            <p className="text-sm text-[color:var(--color-ink-secondary)]">
              Belum ada pengajuan lembur.
            </p>
          ) : (
            <div className="space-y-3">
              {submissions.map((s) => (
                <div key={s.id} className="card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{formatDateID(s.tanggal_lembur)}</p>
                      <p className="text-sm text-[color:var(--color-ink-secondary)]">
                        {s.nama} · {s.jam_mulai} - {s.jam_selesai} (
                        {formatDuration(s.jam_mulai, s.jam_selesai)})
                      </p>
                      <p className="text-sm text-[color:var(--color-ink-muted)] mt-1">
                        {s.pekerjaan}
                      </p>
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
