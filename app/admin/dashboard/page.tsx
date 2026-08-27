import Link from 'next/link';
import { ArrowLeft, ArrowRight, LayoutDashboard, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { queryAll } from '@/lib/db';
import {
  currentMonthValue,
  formatDateShortID,
  formatMinutesCompact,
  formatMinutesLong,
  formatMonthLabelID,
  grossPayMinutes,
  monthRange,
  parseDurationMinutes,
  shiftMonth,
} from '@/lib/utils';

type Row = {
  nik: string | null;
  nama: string;
  tanggal_lembur: string;
  jam_mulai: string;
  jam_selesai: string;
};

const STATUS_TABS = [
  { value: 'approved', label: 'Disetujui' },
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'rejected', label: 'Ditolak' },
];

async function loadMonthMinutes(
  month: string,
  status: string
): Promise<{ rows: Row[]; totalMinutes: number; totalGrossMinutes: number }> {
  const { start, end } = monthRange(month);
  const rows = await queryAll<Row>(
    `SELECT nik, nama, tanggal_lembur, jam_mulai, jam_selesai FROM submissions
     WHERE tanggal_lembur BETWEEN ? AND ? ${status !== 'all' ? 'AND status = ?' : ''}`,
    status !== 'all' ? [start, end, status] : [start, end]
  );
  let totalMinutes = 0;
  let totalGrossMinutes = 0;
  for (const r of rows) {
    const net = parseDurationMinutes(r.jam_mulai, r.jam_selesai);
    totalMinutes += net;
    totalGrossMinutes += grossPayMinutes(net);
  }
  return { rows, totalMinutes, totalGrossMinutes };
}

function Delta({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null;
  const diff = current - previous;
  const pct = Math.round((diff / previous) * 100);
  if (pct === 0)
    return <span className="text-xs text-[color:var(--color-ink-muted)]">sama seperti bulan lalu</span>;
  const up = diff > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        up ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'
      }`}
    >
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {Math.abs(pct)}% vs bulan lalu
    </span>
  );
}

function StatTile({
  label,
  value,
  delta,
  accent,
  icon,
}: {
  label: string;
  value: string;
  delta?: React.ReactNode;
  accent?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className={`card p-4 sm:p-5 ${accent ? 'ring-1 ring-[color:var(--color-accent)]/20' : ''}`}>
      <p className="text-xs sm:text-sm text-[color:var(--color-ink-secondary)] flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="text-2xl sm:text-3xl font-semibold tracking-tight mt-1">{value}</p>
      {delta && <div className="mt-1.5">{delta}</div>}
    </div>
  );
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; status?: string }>;
}) {
  const params = await searchParams;
  const month =
    params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : currentMonthValue();
  const status = params.status && ['all', 'pending', 'approved', 'rejected'].includes(params.status)
    ? params.status
    : 'approved';
  const prevMonth = shiftMonth(month, -1);
  const nextMonth = shiftMonth(month, 1);

  const [{ rows, totalMinutes, totalGrossMinutes }, prev] = await Promise.all([
    loadMonthMinutes(month, status),
    loadMonthMinutes(prevMonth, status),
  ]);

  // Group by NIK when known (stable key) so a name typo/variant never splits one
  // person's hours across two rows — falls back to the name itself for legacy
  // free-text entries with no linked employee record.
  const peopleMinutes = new Map<string, { nama: string; minutes: number; grossMinutes: number }>();
  for (const r of rows) {
    const key = r.nik ?? `nama:${r.nama.trim().toLowerCase()}`;
    const net = parseDurationMinutes(r.jam_mulai, r.jam_selesai);
    const gross = grossPayMinutes(net);
    const existing = peopleMinutes.get(key);
    peopleMinutes.set(key, {
      nama: r.nama,
      minutes: (existing?.minutes ?? 0) + net,
      grossMinutes: (existing?.grossMinutes ?? 0) + gross,
    });
  }
  const ranking = Array.from(peopleMinutes.values()).sort((a, b) => b.minutes - a.minutes);
  const maxPersonMinutes = ranking.length > 0 ? ranking[0].minutes : 0;

  const { start } = monthRange(month);
  const daysInMonth = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();
  const dayMinutes = new Map<string, number>();
  for (const r of rows) {
    dayMinutes.set(
      r.tanggal_lembur,
      (dayMinutes.get(r.tanggal_lembur) ?? 0) + parseDurationMinutes(r.jam_mulai, r.jam_selesai)
    );
  }
  const dailySeries = Array.from({ length: daysInMonth }, (_, i) => {
    const date = `${start.slice(0, 8)}${String(i + 1).padStart(2, '0')}`;
    return { date, minutes: dayMinutes.get(date) ?? 0 };
  });
  const maxDayMinutes = Math.max(...dailySeries.map((d) => d.minutes), 1);

  const peopleCount = peopleMinutes.size;
  const avgMinutes = peopleCount > 0 ? totalMinutes / peopleCount : 0;

  const monthHref = (m: string) => `/admin/dashboard?month=${m}&status=${status}`;
  const statusHref = (s: string) => `/admin/dashboard?month=${month}&status=${s}`;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-start gap-2">
          <LayoutDashboard size={22} className="text-[color:var(--color-accent)] mt-0.5 shrink-0" />
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Dashboard Monitoring Lembur</h1>
            <p className="text-sm text-[color:var(--color-ink-secondary)]">
              Ringkasan total jam lembur per orang dan tren harian.
            </p>
          </div>
        </div>
        <Link href="/admin/submissions" className="btn-secondary btn-sm">
          Lihat Rekap Detail →
        </Link>
      </div>

      <div className="flex gap-1 bg-black/[0.035] rounded-full p-1 w-fit overflow-x-auto max-w-full">
        {STATUS_TABS.map((tab) => {
          const active = status === tab.value;
          return (
            <a
              key={tab.value}
              href={statusHref(tab.value)}
              className={`whitespace-nowrap rounded-full px-3.5 sm:px-4 py-1.5 text-[13px] sm:text-sm font-medium transition ${
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

      <div className="card p-2.5 sm:p-3 flex items-center justify-center gap-2 sm:gap-4">
        <Link href={monthHref(prevMonth)} className="btn-secondary btn-sm px-3">
          <ArrowLeft size={15} />
          <span className="hidden xs:inline">Bulan Lalu</span>
        </Link>
        <p className="text-sm sm:text-base font-semibold min-w-[130px] sm:min-w-[180px] text-center">
          {formatMonthLabelID(month)}
        </p>
        <Link href={monthHref(nextMonth)} className="btn-secondary btn-sm px-3">
          <span className="hidden xs:inline">Bulan Depan</span>
          <ArrowRight size={15} />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
        <StatTile
          label="Total Jam Lembur"
          value={formatMinutesCompact(totalMinutes)}
          delta={<Delta current={totalMinutes} previous={prev.totalMinutes} />}
        />
        <StatTile
          label="Jam Kotor (Dasar Gaji)"
          value={formatMinutesCompact(totalGrossMinutes)}
          delta={<Delta current={totalGrossMinutes} previous={prev.totalGrossMinutes} />}
          icon={<Wallet size={12} />}
          accent
        />
        <StatTile
          label="Total Pengajuan"
          value={String(rows.length)}
          delta={<Delta current={rows.length} previous={prev.rows.length} />}
        />
        <StatTile label="Orang Aktif" value={String(peopleCount)} />
        <StatTile label="Rata-rata Jam / Orang" value={formatMinutesCompact(avgMinutes)} />
      </div>

      <div className="card p-4 sm:p-6">
        <h2 className="font-semibold mb-1 flex items-center gap-1.5">
          Jam Lembur per Orang
        </h2>
        <p className="text-xs sm:text-sm text-[color:var(--color-ink-secondary)] mb-4">
          Diurutkan dari yang paling banyak lembur bulan ini. Jam kotor = dasar
          pembayaran gaji (30 menit pertama 1x, sisanya 1,5x).
        </p>
        {ranking.length === 0 ? (
          <p className="text-sm text-[color:var(--color-ink-muted)] py-6 text-center">
            Belum ada data lembur bulan ini.
          </p>
        ) : (
          <div className="space-y-3">
            {ranking.map((p) => {
              const pct = maxPersonMinutes > 0 ? Math.max((p.minutes / maxPersonMinutes) * 100, 3) : 0;
              return (
                <div key={p.nama} className="flex items-center gap-2 sm:gap-3">
                  <p className="w-16 sm:w-40 shrink-0 truncate text-[13px] sm:text-sm">{p.nama}</p>
                  <div
                    className="flex-1 h-5 sm:h-6 rounded-full bg-[color:var(--color-accent-tint)] relative overflow-hidden"
                    title={`${p.nama}: ${formatMinutesLong(p.minutes)} bersih · ${formatMinutesCompact(p.grossMinutes)} kotor`}
                  >
                    <div
                      className="h-full rounded-full bg-[#2a78d6] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-24 sm:w-36 shrink-0 text-right">
                    <p className="text-[13px] sm:text-sm tabular-nums text-[color:var(--color-ink)]">
                      {formatMinutesCompact(p.minutes)}
                    </p>
                    <p className="text-[10px] sm:text-xs tabular-nums text-[color:var(--color-accent)]">
                      {formatMinutesCompact(p.grossMinutes)} kotor
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card p-4 sm:p-6">
        <h2 className="font-semibold mb-1">Tren Harian</h2>
        <p className="text-xs sm:text-sm text-[color:var(--color-ink-secondary)] mb-4">
          Total jam lembur bersih (semua orang) per tanggal dalam {formatMonthLabelID(month)}.
        </p>
        {totalMinutes === 0 ? (
          <p className="text-sm text-[color:var(--color-ink-muted)] py-6 text-center">
            Belum ada data lembur bulan ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <div
              className="flex items-end gap-[2px] h-32 sm:h-40 border-b border-[color:var(--color-border)]"
              style={{ minWidth: `${daysInMonth * 14}px` }}
            >
              {dailySeries.map((d) => {
                const pct = Math.max((d.minutes / maxDayMinutes) * 100, d.minutes > 0 ? 4 : 1.5);
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div
                      className="w-full rounded-t-[4px] bg-[#2a78d6] transition-all duration-500"
                      style={{ height: `${pct}%`, opacity: d.minutes > 0 ? 1 : 0.15 }}
                      title={`${formatDateShortID(d.date)}: ${formatMinutesLong(d.minutes)}`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex gap-[2px] mt-1" style={{ minWidth: `${daysInMonth * 14}px` }}>
              {dailySeries.map((d) => (
                <p
                  key={d.date}
                  className="flex-1 text-center text-[9px] text-[color:var(--color-ink-muted)]"
                >
                  {Number(d.date.slice(8, 10))}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
