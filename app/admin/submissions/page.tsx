import Link from 'next/link';
import { Check, Download, FileSpreadsheet, RotateCcw, X } from 'lucide-react';
import { queryAll } from '@/lib/db';
import {
  approveSubmissionAction,
  deleteSubmissionAction,
  rejectSubmissionAction,
  resetSubmissionStatusAction,
} from '@/lib/actions';
import { formatDateID, formatDuration } from '@/lib/utils';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';
import StatusBadge from '@/components/StatusBadge';

type Row = {
  id: number;
  nama: string;
  tanggal_lembur: string;
  jam_mulai: string;
  jam_selesai: string;
  pekerjaan: string;
  status: string;
  submitted_by: string;
  created_at: string;
};

function buildQuery(from?: string, to?: string, status?: string) {
  let sql = `
    SELECT s.id, s.nama, s.tanggal_lembur, s.jam_mulai, s.jam_selesai, s.pekerjaan, s.status, s.created_at,
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
  if (status && status !== 'all') {
    conditions.push('s.status = ?');
    params.push(status);
  }
  if (conditions.length) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ' ORDER BY s.tanggal_lembur DESC, s.id DESC';
  return { sql, params };
}

const OK_MESSAGES: Record<string, string> = {
  deleted: 'Pengajuan berhasil dihapus.',
  updated: 'Pengajuan berhasil diperbarui.',
  approved: 'Pengajuan disetujui.',
  rejected: 'Pengajuan ditolak.',
  reset: 'Status pengajuan dikembalikan ke menunggu.',
};

const STATUS_TABS = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
];

function ReviewActions({ row }: { row: Row }) {
  if (row.status === 'pending') {
    return (
      <div className="flex flex-wrap gap-1.5">
        <form action={approveSubmissionAction}>
          <input type="hidden" name="id" value={row.id} />
          <button type="submit" className="btn-primary btn-sm bg-[color:var(--color-success)]">
            <Check size={13} /> Setujui
          </button>
        </form>
        <form action={rejectSubmissionAction} className="flex gap-1.5">
          <input type="hidden" name="id" value={row.id} />
          <input
            type="text"
            name="note"
            placeholder="Alasan (opsional)"
            className="input input-sm w-24 sm:w-32"
          />
          <button type="submit" className="btn-danger btn-sm">
            <X size={13} /> Tolak
          </button>
        </form>
      </div>
    );
  }
  return (
    <form action={resetSubmissionStatusAction}>
      <input type="hidden" name="id" value={row.id} />
      <button type="submit" className="btn-secondary btn-sm">
        <RotateCcw size={13} /> Set ke Menunggu
      </button>
    </form>
  );
}

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; status?: string; ok?: string }>;
}) {
  const params = await searchParams;
  const from = params.from || '';
  const to = params.to || '';
  const status = params.status || 'all';

  const { sql, params: queryParams } = buildQuery(from, to, status);
  const rows = await queryAll<Row>(sql, queryParams);

  const exportQuery = new URLSearchParams({ from, to, status });
  const exportHref = `/admin/submissions/export?${exportQuery.toString()}`;
  const ok = params.ok ? OK_MESSAGES[params.ok] : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Rekap Pengajuan Lembur</h1>
          <p className="text-sm text-[color:var(--color-ink-secondary)]">
            Total {rows.length} pengajuan ditampilkan.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a href={exportHref} className="btn-secondary btn-sm">
            <Download size={14} /> Rekap Excel
          </a>
          <Link href="/admin/submissions/export-daily" className="btn-primary btn-sm">
            <FileSpreadsheet size={14} /> Export Format Harian
          </Link>
        </div>
      </div>

      {ok && <p className="alert-success">{ok}</p>}

      <div className="flex gap-1 bg-black/[0.035] rounded-full p-1 w-fit overflow-x-auto max-w-full">
        {STATUS_TABS.map((tab) => {
          const q = new URLSearchParams({ from, to, status: tab.value });
          const active = status === tab.value;
          return (
            <a
              key={tab.value}
              href={`/admin/submissions?${q.toString()}`}
              className={`whitespace-nowrap rounded-full px-3 sm:px-4 py-1.5 text-[13px] sm:text-sm font-medium transition ${
                active
                  ? 'bg-white shadow-sm text-[color:var(--color-ink)]'
                  : 'text-[color:var(--color-ink-secondary)] hover:text-[color:var(--color-ink)]'
              }`}
            >
              {tab.label}
            </a>
          );
        })}
      </div>

      <form className="card p-4 flex flex-wrap items-end gap-4" method="get">
        <input type="hidden" name="status" value={status} />
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
        <button type="submit" className="btn-secondary btn-sm">
          Filter
        </button>
        {(from || to) && (
          <a
            href={`/admin/submissions?status=${status}`}
            className="text-sm text-[color:var(--color-ink-secondary)] underline"
          >
            Reset tanggal
          </a>
        )}
      </form>

      {/* Mobile: card list */}
      <div className="space-y-3 sm:hidden">
        {rows.length === 0 && (
          <p className="text-center text-sm text-[color:var(--color-ink-muted)] py-6">
            Belum ada data untuk filter ini.
          </p>
        )}
        {rows.map((r) => (
          <div key={r.id} className="card p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium">{formatDateID(r.tanggal_lembur)}</p>
                <p className="text-sm">{r.nama}</p>
              </div>
              <StatusBadge status={r.status} />
            </div>
            <p className="text-sm text-[color:var(--color-ink-secondary)]">
              {r.jam_mulai} - {r.jam_selesai} ({formatDuration(r.jam_mulai, r.jam_selesai)})
            </p>
            <p className="text-sm text-[color:var(--color-ink-muted)]">{r.pekerjaan}</p>
            <p className="text-xs text-[color:var(--color-ink-muted)]">Diisi oleh {r.submitted_by}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <ReviewActions row={r} />
              <Link href={`/admin/submissions/${r.id}/edit`} className="btn-secondary btn-sm">
                Edit
              </Link>
              <form action={deleteSubmissionAction}>
                <input type="hidden" name="id" value={r.id} />
                <ConfirmSubmitButton confirmMessage="Hapus pengajuan ini?" className="btn-danger btn-sm">
                  Hapus
                </ConfirmSubmitButton>
              </form>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-black/[0.03] text-left text-[color:var(--color-ink-secondary)]">
            <tr>
              <th className="px-4 py-3 font-medium">Tanggal</th>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Jam</th>
              <th className="px-4 py-3 font-medium">Durasi</th>
              <th className="px-4 py-3 font-medium">Pekerjaan</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Akun Pengisi</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-6 text-center text-[color:var(--color-ink-muted)]"
                >
                  Belum ada data untuk filter ini.
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
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-[color:var(--color-ink-secondary)]">
                  {r.submitted_by}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-end gap-2">
                    <ReviewActions row={r} />
                    <div className="flex gap-2">
                      <Link href={`/admin/submissions/${r.id}/edit`} className="btn-secondary btn-sm">
                        Edit
                      </Link>
                      <form action={deleteSubmissionAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <ConfirmSubmitButton
                          confirmMessage="Hapus pengajuan ini?"
                          className="btn-danger btn-sm"
                        >
                          Hapus
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
