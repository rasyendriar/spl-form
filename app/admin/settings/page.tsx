import { getSettings, isFormOpen } from '@/lib/settings';
import { updateSettingsAction } from '@/lib/actions';
import { formatDateTimeID } from '@/lib/utils';

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const params = await searchParams;
  const settings = await getSettings();
  const open = isFormOpen(settings);

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-xl font-bold">Pengaturan Batas Waktu Pengisian</h1>
        <p className="text-sm text-slate-500">
          Atur kapan form pengajuan lembur dibuka dan kapan ditutup (cut off).
        </p>
      </div>

      {params.ok && <p className="alert-success">Pengaturan berhasil disimpan.</p>}

      <div className="card p-4">
        <p className="text-sm">
          Status saat ini:{' '}
          <span
            className={
              open
                ? 'font-semibold text-emerald-600'
                : 'font-semibold text-red-600'
            }
          >
            {open ? 'TERBUKA' : 'DITUTUP'}
          </span>
        </p>
        {settings.cutoff_at && (
          <p className="text-sm text-slate-500 mt-1">
            Batas waktu: {formatDateTimeID(settings.cutoff_at)}
          </p>
        )}
      </div>

      <div className="card p-6">
        <form action={updateSettingsAction} className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              id="is_open"
              name="is_open"
              type="checkbox"
              defaultChecked={settings.is_open}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="is_open" className="text-sm font-medium text-slate-700">
              Form dibuka (izinkan pengisian lembur)
            </label>
          </div>

          <div>
            <label className="label" htmlFor="cutoff_at">
              Batas Waktu Pengisian (opsional)
            </label>
            <input
              id="cutoff_at"
              name="cutoff_at"
              type="datetime-local"
              defaultValue={settings.cutoff_at}
              className="input"
            />
            <p className="text-xs text-slate-400 mt-1">
              Setelah waktu ini, form otomatis tertutup meski toggle di atas menyala. Kosongkan
              jika tidak ingin ada batas waktu otomatis. Waktu mengikuti zona waktu server.
            </p>
          </div>

          <button type="submit" className="btn-primary">
            Simpan Pengaturan
          </button>
        </form>
      </div>
    </div>
  );
}
