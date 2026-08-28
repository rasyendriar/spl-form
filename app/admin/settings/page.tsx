import { CalendarClock, PauseCircle, PlayCircle } from 'lucide-react';
import { getSettings, isFormOpen, todaysCutoffLabel, todaysCutoffTime } from '@/lib/settings';
import { updateSettingsAction } from '@/lib/actions';
import TimeField from '@/components/TimeField';

const ERROR_MESSAGES: Record<string, string> = {
  invalid: 'Semua jam wajib diisi dengan format yang valid.',
};

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const params = await searchParams;
  const settings = await getSettings();
  const open = isFormOpen(settings);
  const cutoffToday = todaysCutoffTime(settings);
  const cutoffLabel = todaysCutoffLabel();
  const error = params.error ? ERROR_MESSAGES[params.error] : undefined;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start gap-2">
        <CalendarClock size={22} className="text-[color:var(--color-accent)] mt-0.5 shrink-0" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pengaturan Batas Pengisian</h1>
          <p className="text-sm text-[color:var(--color-ink-secondary)] mt-1">
            Atur batas waktu (cut off) pengisian form setiap hari. Senin–Jumat, Sabtu, dan
            Minggu masing-masing punya jadwalnya sendiri.
          </p>
        </div>
      </div>

      {error && <p className="alert-error">{error}</p>}
      {params.ok && <p className="alert-success">Pengaturan berhasil disimpan.</p>}

      <div className="card p-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {open ? (
            <PlayCircle size={20} className="text-[color:var(--color-success)]" />
          ) : (
            <PauseCircle size={20} className="text-[color:var(--color-danger)]" />
          )}
          <div>
            <p className="text-sm text-[color:var(--color-ink-secondary)]">
              Status hari ini ({cutoffLabel})
            </p>
            <p
              className={`text-lg font-semibold ${
                open ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'
              }`}
            >
              {open ? 'Form Terbuka' : 'Form Tertutup'}
            </p>
          </div>
        </div>
        <p className="text-sm text-[color:var(--color-ink-muted)]">Batas: {cutoffToday} WIB</p>
      </div>

      <form action={updateSettingsAction} className="space-y-6">
        <div className="card p-6 flex items-center gap-3">
          <input
            id="is_open"
            name="is_open"
            type="checkbox"
            defaultChecked={settings.is_open}
            className="h-5 w-5 rounded-md border-black/20 text-[color:var(--color-accent)] focus:ring-[color:var(--color-accent)]"
          />
          <label htmlFor="is_open" className="text-sm font-medium">
            Aktifkan form pengisian lembur (tombol darurat — matikan untuk menutup total,
            mis. saat cuti bersama)
          </label>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-sm">Senin – Jumat</h2>
            <div>
              <label className="label">Batas Waktu Pengisian</label>
              <TimeField name="weekday_cutoff_time" defaultValue={settings.weekday_cutoff_time} required />
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-sm">Sabtu</h2>
            <div>
              <label className="label">Batas Waktu Pengisian</label>
              <TimeField name="saturday_cutoff_time" defaultValue={settings.saturday_cutoff_time} required />
            </div>
            <p className="text-xs text-[color:var(--color-ink-muted)]">
              Lembur hari Minggu tetap bisa diajukan di hari Sabtu (tanggal lembur dipilih
              bebas oleh user).
            </p>
          </div>

          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-sm">Minggu</h2>
            <div>
              <label className="label">Batas Waktu Pengisian</label>
              <TimeField name="sunday_cutoff_time" defaultValue={settings.sunday_cutoff_time} required />
            </div>
          </div>
        </div>

        <p className="text-xs text-[color:var(--color-ink-muted)]">
          Setelah jam batas terlewati, form otomatis tertutup untuk hari itu dan terbuka lagi
          keesokan harinya. Semua jam batas di atas mengikuti WIB (Waktu Indonesia Barat),
          apa pun zona waktu server aplikasi ini berjalan.
        </p>

        <button type="submit" className="btn-primary">
          Simpan Pengaturan
        </button>
      </form>
    </div>
  );
}
