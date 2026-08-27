import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const url = process.env.TURSO_DATABASE_URL ?? 'file:./data/app.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

if (url.startsWith('file:')) {
  // Local dev / testing mode only (production always points TURSO_DATABASE_URL at a
  // remote libsql:// database). libsql doesn't create the parent directory itself.
  const filePath = url.slice('file:'.length);
  const dir = path.dirname(path.join(/* turbopackIgnore: true */ process.cwd(), filePath));
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export const client = authToken ? createClient({ url, authToken }) : createClient({ url });

let ready: Promise<void> | null = null;

async function bootstrap() {
  await client.batch(
    [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin','user')),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        expires_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        nama TEXT NOT NULL,
        tanggal_lembur TEXT NOT NULL,
        jam_mulai TEXT NOT NULL,
        jam_selesai TEXT NOT NULL,
        pekerjaan TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
    ],
    'write'
  );

  const adminCountResult = await client.execute(
    `SELECT COUNT(*) as c FROM users WHERE role = 'admin'`
  );
  const adminCount = Number((adminCountResult.rows[0] as any).c);

  if (adminCount === 0) {
    // INSERT OR IGNORE: multiple serverless invocations can race to bootstrap the
    // schema on cold start, so the seed must be safe against races on the unique
    // `username` constraint rather than crashing.
    const hash = bcrypt.hashSync('admin123', 10);
    const result = await client.execute({
      sql: `INSERT OR IGNORE INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)`,
      args: ['admin', hash, 'Administrator', 'admin'],
    });
    if (result.rowsAffected > 0) {
      // eslint-disable-next-line no-console
      console.log(
        '[spl-form] Default admin account created: admin / admin123 (please change immediately)'
      );
    }
  }

  await client.execute({
    sql: `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`,
    args: ['is_open', '1'],
  });
  await client.execute({
    sql: `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`,
    args: ['cutoff_at', ''],
  });
}

export async function ensureSchema() {
  if (!ready) ready = bootstrap();
  await ready;
}

export async function queryAll<T = any>(sql: string, args: any[] = []): Promise<T[]> {
  await ensureSchema();
  const result = await client.execute({ sql, args });
  return result.rows as unknown as T[];
}

export async function queryOne<T = any>(sql: string, args: any[] = []): Promise<T | undefined> {
  const rows = await queryAll<T>(sql, args);
  return rows[0];
}

export async function run(sql: string, args: any[] = []) {
  await ensureSchema();
  return client.execute({ sql, args });
}
