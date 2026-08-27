import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { EMPLOYEE_SEED } from './employee-seed';

const url = process.env.TURSO_DATABASE_URL ?? 'file:./data/app.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

/**
 * True when this deployment is silently falling back to an ephemeral local
 * SQLite file instead of a real Turso database. On Vercel this is a bug trap:
 * each cold start / concurrent instance gets its own empty file, so data
 * written in one request appears to "disappear" later. Surfaced to admins via
 * getDbDiagnostics() so it's visible in the UI instead of failing silently.
 */
export const isUsingFallbackDb = !process.env.TURSO_DATABASE_URL;
export const isOnVercel = Boolean(process.env.VERCEL);

if (isUsingFallbackDb && isOnVercel) {
  // eslint-disable-next-line no-console
  console.error(
    '[spl-form] TURSO_DATABASE_URL is not set on Vercel — falling back to a local SQLite ' +
      'file that does NOT persist between deployments/instances. Data will appear to be ' +
      'lost. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in the Vercel project\'s ' +
      'Environment Variables (Production scope) and redeploy.'
  );
}

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

async function columnExists(table: string, column: string): Promise<boolean> {
  const result = await client.execute(`PRAGMA table_info(${table})`);
  return result.rows.some((row: any) => row.name === column);
}

async function ensureColumn(table: string, column: string, definition: string) {
  if (!(await columnExists(table, column))) {
    await client.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

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
      `CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nik TEXT UNIQUE NOT NULL,
        nama TEXT NOT NULL,
        section TEXT NOT NULL DEFAULT '',
        position TEXT NOT NULL DEFAULT '',
        grup TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
    ],
    'write'
  );

  // Migration-safe: submissions already existed in production before nik/status/
  // review columns existed, so CREATE TABLE IF NOT EXISTS above is a no-op there —
  // add the new columns explicitly for deployments upgrading from the old schema.
  await ensureColumn('submissions', 'nik', 'TEXT');
  await ensureColumn('submissions', 'status', `TEXT NOT NULL DEFAULT 'pending'`);
  await ensureColumn('submissions', 'reviewed_by', 'INTEGER REFERENCES users(id)');
  await ensureColumn('submissions', 'reviewed_at', 'TEXT');
  await ensureColumn('submissions', 'review_note', 'TEXT');
  // NULL = tidak berlaku (bukan Sabtu, atau bukan posisi Staff); 0/1 = eksplisit
  // tidak piket / piket, hanya dikonsultasi oleh grossPayMinutes() untuk hari Sabtu.
  await ensureColumn('submissions', 'piket', 'INTEGER');

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

  const defaultSettings: [string, string][] = [
    ['is_open', '1'],
    ['weekday_cutoff_time', '23:59'],
    ['saturday_cutoff_time', '23:59'],
    ['sunday_cutoff_time', '23:59'],
  ];
  for (const [key, value] of defaultSettings) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`,
      args: [key, value],
    });
  }

  const employeeCountResult = await client.execute(`SELECT COUNT(*) as c FROM employees`);
  const employeeCount = Number((employeeCountResult.rows[0] as any).c);
  if (employeeCount === 0) {
    await client.batch(
      EMPLOYEE_SEED.map((e) => ({
        sql: `INSERT OR IGNORE INTO employees (nik, nama, section, position, grup) VALUES (?, ?, ?, ?, ?)`,
        args: [e.nik.trim(), e.nama, e.section, e.position, e.grup],
      })),
      'write'
    );
  }
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

/** Executes multiple write statements atomically in a single round trip. */
export async function runBatch(statements: { sql: string; args: any[] }[]) {
  await ensureSchema();
  if (statements.length === 0) return;
  return client.batch(statements, 'write');
}
