import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.db');

declare global {
  // eslint-disable-next-line no-var
  var __splDb: Database.Database | undefined;
}

const db = global.__splDb ?? new Database(dbPath);
if (process.env.NODE_ENV !== 'production') {
  global.__splDb = db;
}

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin','user')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nama TEXT NOT NULL,
    tanggal_lembur TEXT NOT NULL,
    jam_mulai TEXT NOT NULL,
    jam_selesai TEXT NOT NULL,
    pekerjaan TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const adminCount = db
  .prepare(`SELECT COUNT(*) as c FROM users WHERE role = 'admin'`)
  .get() as { c: number };

if (adminCount.c === 0) {
  // INSERT OR IGNORE: multiple Next.js build/server worker processes can run this
  // module concurrently on first boot, so the seed must be safe against races on
  // the unique `username` constraint rather than crashing.
  const hash = bcrypt.hashSync('admin123', 10);
  const result = db
    .prepare(
      `INSERT OR IGNORE INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)`
    )
    .run('admin', hash, 'Administrator', 'admin');
  if (result.changes > 0) {
    // eslint-disable-next-line no-console
    console.log('[spl-form] Default admin account created: admin / admin123 (please change immediately)');
  }
}

const settingDefaults: Record<string, string> = {
  is_open: '1',
  cutoff_at: '',
};

const insertSettingIfMissing = db.prepare(
  `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`
);
for (const [key, value] of Object.entries(settingDefaults)) {
  insertSettingIfMissing.run(key, value);
}

export default db;
