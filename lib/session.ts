import { cookies } from 'next/headers';
import crypto from 'crypto';
import db from './db';

const SESSION_COOKIE = 'spl_session';
const SESSION_DAYS = 7;

export type Role = 'admin' | 'user';

export type SessionUser = {
  id: number;
  username: string;
  full_name: string;
  role: Role;
};

export async function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  db.prepare(`INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`).run(
    token,
    userId,
    expires.toISOString()
  );
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    db.prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = db
    .prepare(
      `SELECT u.id as id, u.username as username, u.full_name as full_name, u.role as role, s.expires_at as expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`
    )
    .get(token) as
    | { id: number; username: string; full_name: string; role: Role; expires_at: string }
    | undefined;

  if (!row) return null;

  if (new Date(row.expires_at) < new Date()) {
    db.prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
    return null;
  }

  return { id: row.id, username: row.username, full_name: row.full_name, role: row.role };
}
