import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DailyTrendChart, { type DailyTrendPoint } from './DailyTrendChart';
import { formatDateShortID, formatMinutesLong } from '@/lib/utils';

// Day-of-month labels are 11/12/13 on purpose, so they never collide as text
// with the "2,5" / "1,5" / "3,5" / "2,3" hour labels asserted below.
const series: DailyTrendPoint[] = [
  { date: '2026-09-11', netMinutes: 150, grossMinutes: 210 }, // 2,5 jam kotor / 3,5 jam bersih
  { date: '2026-09-12', netMinutes: 0, grossMinutes: 0 },
  { date: '2026-09-13', netMinutes: 90, grossMinutes: 135 }, // 1,5 jam kotor / 2,3 jam bersih
];

describe('DailyTrendChart', () => {
  it('defaults to "Jam Kotor" (jam kerja aktual) in red, with a numeric label per non-zero bar', () => {
    render(<DailyTrendChart series={series} />);

    expect(screen.getByText('2,5')).toBeInTheDocument();
    expect(screen.getByText('1,5')).toBeInTheDocument();

    const bar = screen.getByTitle(`${formatDateShortID('2026-09-11')}: ${formatMinutesLong(150)}`);
    expect(bar).toHaveStyle({ backgroundColor: 'var(--color-danger)' });
  });

  it('switches to "Jam Bersih" (jam setelah pengali gaji) in blue when toggled', async () => {
    render(<DailyTrendChart series={series} />);

    await userEvent.click(screen.getByRole('button', { name: 'Jam Bersih' }));

    expect(screen.getByText('3,5')).toBeInTheDocument();
    expect(screen.getByText('2,3')).toBeInTheDocument();
    // The kotor-view label for this same day should be gone now.
    expect(screen.queryByText('2,5')).not.toBeInTheDocument();

    const bar = screen.getByTitle(`${formatDateShortID('2026-09-11')}: ${formatMinutesLong(210)}`);
    expect(bar).toHaveStyle({ backgroundColor: 'var(--color-accent)' });
  });

  it('shows an empty state when the active view has no data at all', () => {
    const empty: DailyTrendPoint[] = [{ date: '2026-09-01', netMinutes: 0, grossMinutes: 0 }];
    render(<DailyTrendChart series={empty} />);
    expect(screen.getByText('Belum ada data lembur bulan ini.')).toBeInTheDocument();
  });
});
