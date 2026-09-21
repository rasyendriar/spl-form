'use client';

import { useState } from 'react';
import { formatDateShortID, formatHoursNumber, formatMinutesLong } from '@/lib/utils';

export type DailyTrendPoint = {
  date: string;
  /** Jam kerja aktual (mulai–selesai dikurangi istirahat), tanpa pengali gaji. */
  netMinutes: number;
  /** Jam setelah pengali gaji (1,5x/2x) — dasar pembayaran. */
  grossMinutes: number;
};

type View = 'kotor' | 'bersih';

const VIEW_CONFIG: Record<View, { label: string; color: string; activeText: string }> = {
  kotor: { label: 'Jam Kotor', color: 'var(--color-danger)', activeText: 'text-[color:var(--color-danger)]' },
  bersih: { label: 'Jam Bersih', color: 'var(--color-accent)', activeText: 'text-[color:var(--color-accent)]' },
};

export default function DailyTrendChart({ series }: { series: DailyTrendPoint[] }) {
  const [view, setView] = useState<View>('kotor');

  const values = series.map((d) => (view === 'kotor' ? d.netMinutes : d.grossMinutes));
  const maxValue = Math.max(...values, 1);
  const hasData = values.some((v) => v > 0);
  const { color } = VIEW_CONFIG[view];

  return (
    <div className="card p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-semibold">Tren Harian</h2>
        <div className="flex gap-1 bg-black/[0.035] rounded-full p-1 w-fit">
          {(Object.keys(VIEW_CONFIG) as View[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition ${
                view === key
                  ? `bg-white shadow-sm ${VIEW_CONFIG[key].activeText}`
                  : 'text-[color:var(--color-ink-secondary)] hover:text-[color:var(--color-ink)]'
              }`}
            >
              {VIEW_CONFIG[key].label}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <p className="text-sm text-[color:var(--color-ink-muted)] py-6 text-center">
          Belum ada data lembur bulan ini.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <div
            className="flex items-end gap-[3px] h-36 sm:h-44 border-b border-[color:var(--color-border)]"
            style={{ minWidth: `${series.length * 28}px` }}
          >
            {series.map((d, i) => {
              const value = values[i];
              const pct = Math.max((value / maxValue) * 100, value > 0 ? 4 : 1.5);
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full">
                  {value > 0 && (
                    <span className="text-[8px] sm:text-[9px] tabular-nums text-[color:var(--color-ink-secondary)] mb-0.5 whitespace-nowrap">
                      {formatHoursNumber(value)}
                    </span>
                  )}
                  <div
                    className="w-full rounded-t-[4px] transition-all duration-500"
                    style={{ height: `${pct}%`, opacity: value > 0 ? 1 : 0.15, backgroundColor: color }}
                    title={`${formatDateShortID(d.date)}: ${formatMinutesLong(value)}`}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex gap-[3px] mt-1" style={{ minWidth: `${series.length * 28}px` }}>
            {series.map((d) => (
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
  );
}
