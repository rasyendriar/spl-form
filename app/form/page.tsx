import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getSettings, isFormOpen, todaysCutoffLabel, todaysCutoffTime } from '@/lib/settings';
import { deleteSubmissionAction } from '@/lib/actions';
import { formatDateID, formatDuration, todayInputValue } from '@/lib/utils';
import { queryAll } from '@/lib/db';
import Header from '@/components/Header';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';
import OvertimeForm from '@/components/OvertimeForm';
import StatusBadge from '@/components/StatusBadge';
import { Employee } from '@/components/EmployeePicker';

const ERROR_MESSAGES: Record<string, string> = {
  closed: 'Pengisian form sedang ditutup untuk hari ini. Silakan hubungi admin.',
  empty: 'Isi tanggal, minimal satu nama, pekerjaan, jam mulai, dan jam selesai.',
  invalid_block: 'Setiap pekerjaan wajib punya nama, pekerjaan, jam mulai, dan jam selesai yang valid.',
  locked: 'Pengajuan yang sudah diproses admin (disetujui/ditolak) tidak bisa dihapus sendiri.',
};

type Submission = {
  id: number;
  nama: string;
  tanggal_lembur: string;
  jam_mulai: string;
  jam_selesai: string;
  pekerjaan: string;
  status: string;
  review_note: string | null;
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
  const cutoffLabel = todaysCutoffLabel();

  const [submissions, employees] = await Promise.all([
    queryAll<Submission>(
      `SELECT id, nama, tanggal_lembur, jam_mulai, jam_selesai, pekerjaan, status, review_note
       FROM submissions WHERE user_id = ?
       ORDER BY tanggal_lembur DESC, id DESC`,
      [session!.id]
    ),
    queryAll<Employee>(`SELECT nik, nama, section, position FROM employees ORDER BY nama ASC`),
  ]);

  const nav =
    session!.role === 'admin'
      ? [
          { href: '/admin/dashboard', label: 'Dashboard' },
          { href: '/admin/submissions', label: 'Pengajuan' },
          { href: '/admin/employees', label: 'Kelola Karyawan' },
          { href: '/admin/users', label: 'Kelola User' },
          { href: '/admin/settings', label: 'Pengaturan' },
        ]
      : [];

  const myEmployeeRecord = employees.find(
    (e) => e.nama.toLowerCase() === session!.full_name.toLowerCase()
  );

  const error = params.error ? ERROR_MESSAGES[params.error] : undefined;

  return (
    <div>
      <Header user={session!} nav={nav} />
      <main className="mx-auto max-w-2xl px-4 py-6 sm:py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ajukan Lembur</h1>
          <p className="text-sm text-[color:var(--color-ink-secondary)] mt-1">
            Isi data lembur kamu. Bisa juga untuk merencanakan lembur di hari lain, atau
            sekaligus untuk beberapa orang.
          </p>
        </div>

        {!open && (
          <p className="alert-info">
            Form pengisian lembur sedang <strong>ditutup</strong> untuk hari ini ({cutoffLabel},
            batas jam {cutoffToday}). Hubungi admin jika kamu perlu mengajukan lembur.
          </p>
        )}

        {error && <p className="alert-error">{error}</p>}
        {params.ok === '1' && (
          <p className="alert-success">
            Pengajuan lembur berhasil disimpan{params.count ? ` (${params.count} entri)` : ''}.
          </p>
        )}
        {params.ok === 'deleted' && <p className="alert-success">Pengajuan berhasil dihapus.</p>}

        <div className="card p-4 sm:p-6">
          <OvertimeForm
            defaultPerson={{
              nik: myEmployeeRecord?.nik ?? null,
              nama: session!.full_name,
            }}
            defaultDate={todayInputValue()}
            employees={employees}
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
                <div key={s.id} className="card p-4 animate-fade-in-up">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{formatDateID(s.tanggal_lembur)}</p>
                        <StatusBadge status={s.status} />
                      </div>
                      <p className="text-sm text-[color:var(--color-ink-secondary)]">
                        {s.nama} · {s.jam_mulai} - {s.jam_selesai} (
                        {formatDuration(s.jam_mulai, s.jam_selesai)})
                      </p>
                      <p className="text-sm text-[color:var(--color-ink-muted)] mt-1">
                        {s.pekerjaan}
                      </p>
                      {s.status === 'rejected' && s.review_note && (
                        <p className="text-xs text-[color:var(--color-danger)] mt-1">
                          Alasan ditolak: {s.review_note}
                        </p>
                      )}
                    </div>
                    {s.status === 'pending' && (
                      <form action={deleteSubmissionAction} className="shrink-0">
                        <input type="hidden" name="id" value={s.id} />
                        <ConfirmSubmitButton
                          confirmMessage="Hapus pengajuan ini?"
                          className="btn-danger text-xs"
                        >
                          Hapus
                        </ConfirmSubmitButton>
                      </form>
                    )}
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
