import db from '@/lib/db';
import { deleteSubmissionAction } from '@/lib/actions';
import { formatDateID, formatDuration } from '@/lib/utils';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';

type Row = {
  id: number;
  nama: string;
  tanggal_lembur: string;
  jam_mulai: string;
  jam_selesai: string;
  pekerjaan: string;
  submitted_by: string;
  created_at: string;
};

function buildQuery(from?: string, to?: string) {
  let sql = `
    SELECT s.id, s.nama, s.tanggal_lembur, s.jam_mulai, s.jam_selesai, s.pekerjaan, s.created_at,
           u.full_name as submitted_by
    FROM submissions s
    JOIN users u ON u.id = s.user_id
  `;
  const conditions: string[] = [];
  const params: string[] = [];

  if (from) {
    conditions.push('s.tanggal_lembur >= ?');
    params.push(from);
  }
  if (to) {
    conditions.push('s.tanggal_lembur <= ?');
    params.push(to);
  }
  if (conditions.length) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ' ORDER BY s.tanggal_lembur DESC, s.id DESC';
  return { sql, params };
}

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; ok?: string }>;
}) {
  const params = await searchParams;
  const from = params.from || '';
  const to = params.to || '';

  const { sql, params: queryParams } = buildQuery(from, to);
  const rows = db.prepare(sql).all(...queryParams) as Row[];

  const exportHref = `/admin/submissions/export?${new URLSearchParams({ from, to }).toString()}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Rekap Pengajuan Lembur</h1>
          <p className="text-sm text-slate-500">Total {rows.length} pengajuan ditampilkan.</p>
        </div>
        <a href={exportHref} className="btn-primary">
          Export ke Excel
        </a>
      </div>

      {params.ok === 'deleted' && (
        <p className="alert-success">Pengajuan berhasil dihapus.</p>
      )}

      <form className="card p-4 flex flex-wrap items-end gap-4" method="get">
        <div>
          <label className="label" htmlFor="from">
            Dari Tanggal
          </label>
          <input id="from" name="from" type="date" defaultValue={from} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="to">
            Sampai Tanggal
          </label>
          <input id="to" name="to" type="date" defaultValue={to} className="input" />
        </div>
        <button type="submit" className="btn-secondary">
          Filter
        </button>
        {(from || to) && (
          <a href="/admin/submissions" className="text-sm text-slate-500 underline">
            Reset filter
          </a>
        )}
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Tanggal</th>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Jam</th>
              <th className="px-4 py-3 font-medium">Durasi</th>
              <th className="px-4 py-3 font-medium">Pekerjaan</th>
              <th className="px-4 py-3 font-medium">Akun Pengisi</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Belum ada data untuk rentang tanggal ini.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 whitespace-nowrap">{formatDateID(r.tanggal_lembur)}</td>
                <td className="px-4 py-3">{r.nama}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {r.jam_mulai} - {r.jam_selesai}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatDuration(r.jam_mulai, r.jam_selesai)}
                </td>
                <td className="px-4 py-3 max-w-xs">{r.pekerjaan}</td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-500">{r.submitted_by}</td>
                <td className="px-4 py-3 text-right">
                  <form action={deleteSubmissionAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <ConfirmSubmitButton
                      confirmMessage="Hapus pengajuan ini?"
                      className="btn-danger text-xs"
                    >
                      Hapus
                    </ConfirmSubmitButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
