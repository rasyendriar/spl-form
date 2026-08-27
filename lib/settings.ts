import { queryAll, run } from './db';
import { isValidHHMM } from './utils';

export type AppSettings = {
  is_open: boolean;
  weekday_cutoff_time: string; // HH:MM, Senin-Jumat
  saturday_cutoff_time: string; // HH:MM, Sabtu
  sunday_cutoff_time: string; // HH:MM, Minggu
};

const DEFAULTS: AppSettings = {
  is_open: true,
  weekday_cutoff_time: '23:59',
  saturday_cutoff_time: '23:59',
  sunday_cutoff_time: '23:59',
};

export async function getSettings(): Promise<AppSettings> {
  const rows = await queryAll<{ key: string; value: string }>(`SELECT key, value FROM settings`);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    is_open: (map.is_open ?? '1') === '1',
    weekday_cutoff_time: map.weekday_cutoff_time || DEFAULTS.weekday_cutoff_time,
    saturday_cutoff_time: map.saturday_cutoff_time || DEFAULTS.saturday_cutoff_time,
    sunday_cutoff_time: map.sunday_cutoff_time || DEFAULTS.sunday_cutoff_time,
  };
}

export async function updateSettings(next: AppSettings) {
  const upsert = `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`;
  await run(upsert, ['is_open', next.is_open ? '1' : '0']);
  await run(upsert, ['weekday_cutoff_time', next.weekday_cutoff_time]);
  await run(upsert, ['saturday_cutoff_time', next.saturday_cutoff_time]);
  await run(upsert, ['sunday_cutoff_time', next.sunday_cutoff_time]);
}

/** Batas waktu pengisian hari ini (Minggu, Sabtu, atau Senin-Jumat punya jadwal masing-masing). */
export function todaysCutoffTime(settings: AppSettings, now: Date = new Date()): string {
  const day = now.getDay(); // 0=Minggu, 6=Sabtu
  if (day === 0) return settings.sunday_cutoff_time;
  if (day === 6) return settings.saturday_cutoff_time;
  return settings.weekday_cutoff_time;
}

export function todaysCutoffLabel(now: Date = new Date()): string {
  const day = now.getDay();
  if (day === 0) return 'Minggu';
  if (day === 6) return 'Sabtu';
  return 'Hari Biasa (Senin–Jumat)';
}

export function isFormOpen(settings: AppSettings, now: Date = new Date()): boolean {
  if (!settings.is_open) return false;
  const cutoff = todaysCutoffTime(settings, now);
  if (!cutoff || !isValidHHMM(cutoff)) return true;
  const [h, m] = cutoff.split(':').map(Number);
  const cutoffMinutes = h * 60 + m;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes <= cutoffMinutes;
}
