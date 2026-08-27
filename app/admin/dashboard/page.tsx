import Link from 'next/link';
import { queryAll } from '@/lib/db';
import {
  currentMonthValue,
  formatDateShortID,
  formatMinutesCompact,
  formatMinutesLong,
  formatMonthLabelID,
  monthRange,
  parseDurationMinutes,
  shiftMonth,
} from '@/lib/utils';

type Row = {
  nama: string;
  tanggal_lembur: string;
  jam_mulai: string;
  jam_selesai: string;
};

async function loadMonthMinutes(month: string): Promise<{ rows: Row[]; totalMinutes: number }> {
  const { start, end } = monthRange(month);
  const rows = await queryAll<Row>(
    `SELECT nama, tanggal_lembur, jam_mulai, jam_selesai FROM submissions
     WHERE tanggal_lembur BETWEEN ? AND ?`,
    [start, end]
  );
  const totalMinutes = rows.reduce(
    (sum, r) => sum + parseDurationMinutes(r.jam_mulai, r.jam_selesai),
    0
  );
  return { rows, totalMinutes };
}

function Delta({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null;
  const diff = current - previous;
  const pct = Math.round((diff / previous) * 100);
  if (pct === 0) return <span className="text-xs text-[color:var(--color-ink-muted)]">sama seperti bulan lalu</span>;
  const up = diff > 0;
  return (
    <span
      className={`text-xs font-medium ${
        up ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'
      }`}
    >
      {up ? '▲' : '▼'} {Math.abs(pct)}% vs bulan lalu
    </span>
  );
}

function StatTile({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <p className="text-sm text-[color:var(--color-ink-secondary)]">{label}</p>
      <p className="text-3xl font-semibold tracking-tight mt-1">{value}</p>
      {delta && <div className="mt-1.5">{delta}</div>}
    </div>
  );
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const month = params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : currentMonthValue();
  const prevMonth = shiftMonth(month, -1);
  const nextMonth = shiftMonth(month, 1);

  const [{ rows, totalMinutes }, prev] = await Promise.all([
    loadMonthMinutes(month),
    loadMonthMinutes(prevMonth),
  ]);

  const peopleMinutes = new Map<string, number>();
  for (const r of rows) {
    const minutes = parseDurationMinutes(r.jam_mulai, r.jam_selesai);
    peopleMinutes.set(r.nama, (peopleMinutes.get(r.nama) ?? 0) + minutes);
  }
  const ranking = Array.from(peopleMinutes.entries())
    .map(([nama, minutes]) => ({ nama, minutes }))
    .sort((a, b) => b.minutes - a.minutes);
  const maxPersonMinutes = ranking.length > 0 ? ranking[0].minutes : 0;

  const { start } = monthRange(month);
  const daysInMonth = new Date(
    Number(month.slice(0, 4)),
    Number(month.slice(5, 7)),
    0
  ).getDate();
  const dayMinutes = new Map<string, number>();
  for (const r of rows) {
    dayMinutes.set(r.tanggal_lembur, (dayMinutes.get(r.tanggal_lembur) ?? 0) + parseDurationMinutes(r.jam_mulai, r.jam_selesai));
  }
  const dailySeries = Array.from({ length: daysInMonth }, (_, i) => {
    const date = `${start.slice(0, 8)}${String(i + 1).padStart(2, '0')}`;
    return { date, minutes: dayMinutes.get(date) ?? 0 };
  });
  const maxDayMinutes = Math.max(...dailySeries.map((d) => d.minutes), 1);

  const peopleCount = peopleMinutes.size;
  const avgMinutes = peopleCount > 0 ? totalMinutes / peopleCount : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard Monitoring Lembur</h1>
          <p className="text-sm text-[color:var(--color-ink-secondary)]">
            Ringkasan total jam lembur per orang dan tren harian.
          </p>
        </div>
        <Link href="/admin/submissions" className="btn-secondary text-sm">
          Lihat Rekap Detail →
        </Link>
      </div>

      <div className="card p-3 flex items-center justify-center gap-4">
        <Link href={`/admin/dashboard?month=${prevMonth}`} className="btn-secondary px-3">
          ← Bulan Lalu
        </Link>
        <p className="text-base font-semibold min-w-[180px] text-center">
          {formatMonthLabelID(month)}
        </p>
        <Link href={`/admin/dashboard?month=${nextMonth}`} className="btn-secondary px-3">
          Bulan Depan →
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Total Jam Lembur"
          value={formatMinutesCompact(totalMinutes)}
          delta={<Delta current={totalMinutes} previous={prev.totalMinutes} />}
        />
        <StatTile
          label="Total Pengajuan"
          value={String(rows.length)}
          delta={<Delta current={rows.length} previous={prev.rows.length} />}
        />
        <StatTile label="Orang Aktif Lembur" value={String(peopleCount)} />
        <StatTile label="Rata-rata Jam / Orang" value={formatMinutesCompact(avgMinutes)} />
      </div>

      <div className="card p-6">
        <h2 className="font-semibold mb-1">Jam Lembur per Orang</h2>
        <p className="text-sm text-[color:var(--color-ink-secondary)] mb-4">
          Diurutkan dari yang paling banyak lembur bulan ini.
        </p>
        {ranking.length === 0 ? (
          <p className="text-sm text-[color:var(--color-ink-muted)] py-6 text-center">
            Belum ada data lembur bulan ini.
          </p>
        ) : (
          <div className="space-y-2.5">
            {ranking.map((p) => {
              const pct = maxPersonMinutes > 0 ? Math.max((p.minutes / maxPersonMinutes) * 100, 3) : 0;
              return (
                <div key={p.nama} className="flex items-center gap-3">
                  <p className="w-32 sm:w-40 shrink-0 truncate text-sm">{p.nama}</p>
                  <div
                    className="flex-1 h-6 rounded-full bg-[color:var(--color-accent-tint)] relative overflow-hidden"
                    title={`${p.nama}: ${formatMinutesLong(p.minutes)}`}
                  >
                    <div
                      className="h-full rounded-full bg-[#2a78d6]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="w-24 shrink-0 text-right text-sm tabular-nums text-[color:var(--color-ink-secondary)]">
                    {formatMinutesCompact(p.minutes)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card p-6">
        <h2 className="font-semibold mb-1">Tren Harian</h2>
        <p className="text-sm text-[color:var(--color-ink-secondary)] mb-4">
          Total jam lembur (semua orang) per tanggal dalam {formatMonthLabelID(month)}.
        </p>
        {totalMinutes === 0 ? (
          <p className="text-sm text-[color:var(--color-ink-muted)] py-6 text-center">
            Belum ada data lembur bulan ini.
          </p>
        ) : (
          <div className="flex items-end gap-[2px] h-40 border-b border-[color:var(--color-border)]">
            {dailySeries.map((d) => {
              const pct = Math.max((d.minutes / maxDayMinutes) * 100, d.minutes > 0 ? 4 : 1.5);
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div
                    className="w-full rounded-t-[4px] bg-[#2a78d6]"
                    style={{ height: `${pct}%`, opacity: d.minutes > 0 ? 1 : 0.15 }}
                    title={`${formatDateShortID(d.date)}: ${formatMinutesLong(d.minutes)}`}
                  />
                </div>
              );
            })}
          </div>
        )}
        {totalMinutes > 0 && (
          <div className="flex gap-[2px] mt-1">
            {dailySeries.map((d) => (
              <p
                key={d.date}
                className="flex-1 text-center text-[9px] text-[color:var(--color-ink-muted)]"
              >
                {Number(d.date.slice(8, 10))}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
