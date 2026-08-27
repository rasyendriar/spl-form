import { queryAll, run } from './db';

export type AppSettings = {
  is_open: boolean;
  cutoff_at: string; // ISO-ish local datetime string from <input type="datetime-local">, or '' for none
};

export async function getSettings(): Promise<AppSettings> {
  const rows = await queryAll<{ key: string; value: string }>(`SELECT key, value FROM settings`);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    is_open: map.is_open === '1',
    cutoff_at: map.cutoff_at ?? '',
  };
}

export async function updateSettings(next: AppSettings) {
  const upsert = `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`;
  await run(upsert, ['is_open', next.is_open ? '1' : '0']);
  await run(upsert, ['cutoff_at', next.cutoff_at ?? '']);
}

export function isFormOpen(settings: AppSettings, now: Date = new Date()): boolean {
  if (!settings.is_open) return false;
  if (settings.cutoff_at) {
    const cutoff = new Date(settings.cutoff_at);
    if (!Number.isNaN(cutoff.getTime()) && now > cutoff) return false;
  }
  return true;
}
