import db from './db';

export type AppSettings = {
  is_open: boolean;
  cutoff_at: string; // ISO-ish local datetime string from <input type="datetime-local">, or '' for none
};

export function getSettings(): AppSettings {
  const rows = db.prepare(`SELECT key, value FROM settings`).all() as {
    key: string;
    value: string;
  }[];
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    is_open: map.is_open === '1',
    cutoff_at: map.cutoff_at ?? '',
  };
}

export function updateSettings(next: AppSettings) {
  const upsert = db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  );
  upsert.run('is_open', next.is_open ? '1' : '0');
  upsert.run('cutoff_at', next.cutoff_at ?? '');
}

export function isFormOpen(settings: AppSettings, now: Date = new Date()): boolean {
  if (!settings.is_open) return false;
  if (settings.cutoff_at) {
    const cutoff = new Date(settings.cutoff_at);
    if (!Number.isNaN(cutoff.getTime()) && now > cutoff) return false;
  }
  return true;
}
