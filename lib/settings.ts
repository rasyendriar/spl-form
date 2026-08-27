import { queryAll, run } from './db';
import { isSaturdayDate, isValidHHMM } from './utils';

export type AppSettings = {
  is_open: boolean;
  weekday_start_time: string; // HH:MM, jam mulai lembur standar Minggu-Jumat
  saturday_start_time: string; // HH:MM, jam mulai lembur standar khusus Sabtu
  weekday_cutoff_time: string; // HH:MM, batas waktu pengisian harian Minggu-Jumat
  saturday_cutoff_time: string; // HH:MM, batas waktu pengisian harian khusus Sabtu
};

const DEFAULTS: AppSettings = {
  is_open: true,
  weekday_start_time: '17:00',
  saturday_start_time: '13:00',
  weekday_cutoff_time: '23:59',
  saturday_cutoff_time: '23:59',
};

export async function getSettings(): Promise<AppSettings> {
  const rows = await queryAll<{ key: string; value: string }>(`SELECT key, value FROM settings`);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    is_open: (map.is_open ?? '1') === '1',
    weekday_start_time: map.weekday_start_time || DEFAULTS.weekday_start_time,
    saturday_start_time: map.saturday_start_time || DEFAULTS.saturday_start_time,
    weekday_cutoff_time: map.weekday_cutoff_time || DEFAULTS.weekday_cutoff_time,
    saturday_cutoff_time: map.saturday_cutoff_time || DEFAULTS.saturday_cutoff_time,
  };
}

export async function updateSettings(next: AppSettings) {
  const upsert = `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`;
  await run(upsert, ['is_open', next.is_open ? '1' : '0']);
  await run(upsert, ['weekday_start_time', next.weekday_start_time]);
  await run(upsert, ['saturday_start_time', next.saturday_start_time]);
  await run(upsert, ['weekday_cutoff_time', next.weekday_cutoff_time]);
  await run(upsert, ['saturday_cutoff_time', next.saturday_cutoff_time]);
}

/** Batas waktu pengisian hari ini (dipakai untuk mengecek apakah form masih terbuka). */
export function todaysCutoffTime(settings: AppSettings, now: Date = new Date()): string {
  return now.getDay() === 6 ? settings.saturday_cutoff_time : settings.weekday_cutoff_time;
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

/** Jam mulai lembur standar untuk tanggal tertentu (beda khusus hari Sabtu). */
export function standardStartTime(settings: AppSettings, tanggalLembur: string): string {
  return isSaturdayDate(tanggalLembur) ? settings.saturday_start_time : settings.weekday_start_time;
}
