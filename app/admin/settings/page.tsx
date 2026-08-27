import { getSettings, isFormOpen, todaysCutoffTime } from '@/lib/settings';
import { updateSettingsAction } from '@/lib/actions';

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
  const error = params.error ? ERROR_MESSAGES[params.error] : undefined;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pengaturan Jam Lembur</h1>
        <p className="text-sm text-[color:var(--color-ink-secondary)] mt-1">
          Atur jam mulai lembur standar dan batas waktu (cut off) pengisian setiap hari.
          Sabtu punya jadwal sendiri.
        </p>
      </div>

      {error && <p className="alert-error">{error}</p>}
      {params.ok && <p className="alert-success">Pengaturan berhasil disimpan.</p>}

      <div className="card p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-[color:var(--color-ink-secondary)]">Status hari ini</p>
          <p
            className={`text-lg font-semibold ${
              open ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'
            }`}
          >
            {open ? 'Form Terbuka' : 'Form Tertutup'}
          </p>
        </div>
        <p className="text-sm text-[color:var(--color-ink-muted)]">Batas hari ini: {cutoffToday}</p>
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

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold">Hari Biasa (Minggu–Jumat)</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="weekday_start_time">
                Jam Mulai Lembur Standar
              </label>
              <input
                id="weekday_start_time"
                name="weekday_start_time"
                type="time"
                required
                defaultValue={settings.weekday_start_time}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="weekday_cutoff_time">
                Batas Waktu Pengisian (Cut Off)
              </label>
              <input
                id="weekday_cutoff_time"
                name="weekday_cutoff_time"
                type="time"
                required
                defaultValue={settings.weekday_cutoff_time}
                className="input"
              />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold">Sabtu</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="saturday_start_time">
                Jam Mulai Lembur Standar
              </label>
              <input
                id="saturday_start_time"
                name="saturday_start_time"
                type="time"
                required
                defaultValue={settings.saturday_start_time}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="saturday_cutoff_time">
                Batas Waktu Pengisian (Cut Off)
              </label>
              <input
                id="saturday_cutoff_time"
                name="saturday_cutoff_time"
                type="time"
                required
                defaultValue={settings.saturday_cutoff_time}
                className="input"
              />
            </div>
          </div>
        </div>

        <p className="text-xs text-[color:var(--color-ink-muted)]">
          Jam mulai lembur otomatis dipakai sistem sesuai hari dari tanggal lembur yang
          dipilih user (user hanya mengisi jam selesai). Batas waktu pengisian berlaku
          setiap hari berdasarkan jam saat ini, mengikuti zona waktu server.
        </p>

        <button type="submit" className="btn-primary">
          Simpan Pengaturan
        </button>
      </form>
    </div>
  );
}
