'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import db from './db';
import { createSession, destroySession, getSession } from './session';
import { getSettings, isFormOpen, updateSettings } from './settings';

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    redirect('/login');
  }
  return session;
}

// ---------- Auth ----------

export async function loginAction(formData: FormData) {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!username || !password) {
    redirect('/login?error=empty');
  }

  const user = db
    .prepare(`SELECT id, password_hash, role FROM users WHERE username = ?`)
    .get(username) as { id: number; password_hash: string; role: string } | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    redirect('/login?error=invalid');
  }

  await createSession(user!.id);
  redirect('/');
}

export async function logoutAction() {
  await destroySession();
  redirect('/login');
}

export async function changePasswordAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect('/login');

  const currentPassword = String(formData.get('current_password') ?? '');
  const newPassword = String(formData.get('new_password') ?? '');
  const confirmPassword = String(formData.get('confirm_password') ?? '');

  const user = db
    .prepare(`SELECT password_hash FROM users WHERE id = ?`)
    .get(session!.id) as { password_hash: string };

  if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
    redirect('/account?error=wrong_current');
  }
  if (newPassword.length < 6) {
    redirect('/account?error=too_short');
  }
  if (newPassword !== confirmPassword) {
    redirect('/account?error=mismatch');
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(hash, session!.id);
  redirect('/account?ok=1');
}

// ---------- Submissions (field workers) ----------

export async function createSubmissionAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect('/login');

  const settings = getSettings();
  if (!isFormOpen(settings)) {
    redirect('/form?error=closed');
  }

  const nama = String(formData.get('nama') ?? '').trim();
  const tanggal_lembur = String(formData.get('tanggal_lembur') ?? '').trim();
  const jam_mulai = String(formData.get('jam_mulai') ?? '').trim();
  const jam_selesai = String(formData.get('jam_selesai') ?? '').trim();
  const pekerjaan = String(formData.get('pekerjaan') ?? '').trim();

  if (!nama || !tanggal_lembur || !jam_mulai || !jam_selesai || !pekerjaan) {
    redirect('/form?error=empty');
  }

  db.prepare(
    `INSERT INTO submissions (user_id, nama, tanggal_lembur, jam_mulai, jam_selesai, pekerjaan)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(session!.id, nama, tanggal_lembur, jam_mulai, jam_selesai, pekerjaan);

  revalidatePath('/form');
  redirect('/form?ok=1');
}

export async function deleteSubmissionAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect('/login');

  const id = Number(formData.get('id'));
  const submission = db
    .prepare(`SELECT user_id FROM submissions WHERE id = ?`)
    .get(id) as { user_id: number } | undefined;

  if (!submission) redirect('/form');
  if (submission!.user_id !== session!.id && session!.role !== 'admin') {
    redirect('/form');
  }

  db.prepare(`DELETE FROM submissions WHERE id = ?`).run(id);
  revalidatePath('/form');
  revalidatePath('/admin/submissions');

  if (session!.role === 'admin') {
    redirect('/admin/submissions?ok=deleted');
  }
  redirect('/form?ok=deleted');
}

// ---------- Admin: user management ----------

export async function createUserAction(formData: FormData) {
  await requireAdmin();

  const username = String(formData.get('username') ?? '').trim().toLowerCase();
  const full_name = String(formData.get('full_name') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const role = String(formData.get('role') ?? 'user') === 'admin' ? 'admin' : 'user';

  if (!username || !full_name || password.length < 6) {
    redirect('/admin/users?error=invalid');
  }

  try {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare(
      `INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)`
    ).run(username, hash, full_name, role);
  } catch (e: any) {
    if (String(e?.message ?? '').includes('UNIQUE')) {
      redirect('/admin/users?error=exists');
    }
    throw e;
  }

  revalidatePath('/admin/users');
  redirect('/admin/users?ok=created');
}

export async function resetPasswordAction(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get('id'));
  const newPassword = String(formData.get('new_password') ?? '');

  if (!id || newPassword.length < 6) {
    redirect('/admin/users?error=invalid_reset');
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(hash, id);

  revalidatePath('/admin/users');
  redirect('/admin/users?ok=reset');
}

export async function deleteUserAction(formData: FormData) {
  const admin = await requireAdmin();

  const id = Number(formData.get('id'));
  if (id === admin!.id) {
    redirect('/admin/users?error=self_delete');
  }

  const target = db.prepare(`SELECT role FROM users WHERE id = ?`).get(id) as
    | { role: string }
    | undefined;

  if (target?.role === 'admin') {
    const adminCount = db
      .prepare(`SELECT COUNT(*) as c FROM users WHERE role = 'admin'`)
      .get() as { c: number };
    if (adminCount.c <= 1) {
      redirect('/admin/users?error=last_admin');
    }
  }

  db.prepare(`DELETE FROM users WHERE id = ?`).run(id);
  revalidatePath('/admin/users');
  redirect('/admin/users?ok=deleted');
}

// ---------- Admin: settings (cutoff window) ----------

export async function updateSettingsAction(formData: FormData) {
  await requireAdmin();

  const is_open = formData.get('is_open') === 'on';
  const cutoff_at = String(formData.get('cutoff_at') ?? '').trim();

  updateSettings({ is_open, cutoff_at });

  revalidatePath('/admin/settings');
  revalidatePath('/form');
  redirect('/admin/settings?ok=1');
}
