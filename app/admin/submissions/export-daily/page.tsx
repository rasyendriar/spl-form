import { FileSpreadsheet } from 'lucide-react';
import { todayInputValue } from '@/lib/utils';

export default function ExportDailyPage() {
  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-start gap-2">
        <FileSpreadsheet size={22} className="text-[color:var(--color-accent)] mt-0.5 shrink-0" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Export Format Harian</h1>
          <p className="text-sm text-[color:var(--color-ink-secondary)] mt-1">
            Export daftar lembur satu hari mengikuti format kolom &amp; merge sel seperti
            template internal (BARCODE, NAMA, TANGGAL, JAM LEMBUR, AKTIVITAS).
          </p>
        </div>
      </div>

      <form action="/admin/submissions/export-daily/file" method="get" className="card p-6 space-y-4">
        <div>
          <label className="label" htmlFor="date">
            Tanggal
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={todayInputValue()}
            className="input"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="all"
            name="all"
            type="checkbox"
            value="1"
            className="h-5 w-5 rounded-md border-black/20 text-[color:var(--color-accent)] focus:ring-[color:var(--color-accent)]"
          />
          <label htmlFor="all" className="text-sm">
            Sertakan yang belum disetujui (default: hanya yang sudah <strong>Disetujui</strong>)
          </label>
        </div>

        <button type="submit" className="btn-primary">
          Download Excel
        </button>
      </form>

      <p className="text-xs text-[color:var(--color-ink-muted)]">
        Kolom BARCODE terisi dari NIK karyawan (jika namanya dipilih dari database karyawan saat
        mengisi form). Kolom JAM ISTIRAHAT 1 &amp; 2 otomatis terisi 12.30–13.30 dan/atau
        17.30–18.30 jika jam lembur melewati jam istirahat tersebut. Kolom POSISI dikosongkan
        karena tidak dicatat di aplikasi ini — bisa diisi manual di Excel bila perlu.
      </p>
    </div>
  );
}
