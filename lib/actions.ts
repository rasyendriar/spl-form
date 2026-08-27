'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { queryOne, run } from './db';
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

  const user = await queryOne<{ id: number; password_hash: string; role: string }>(
    `SELECT id, password_hash, role FROM users WHERE username = ?`,
    [username]
  );

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

  const user = await queryOne<{ password_hash: string }>(
    `SELECT password_hash FROM users WHERE id = ?`,
    [session!.id]
  );

  if (!bcrypt.compareSync(currentPassword, user!.password_hash)) {
    redirect('/account?error=wrong_current');
  }
  if (newPassword.length < 6) {
    redirect('/account?error=too_short');
  }
  if (newPassword !== confirmPassword) {
    redirect('/account?error=mismatch');
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  await run(`UPDATE users SET password_hash = ? WHERE id = ?`, [hash, session!.id]);
  redirect('/account?ok=1');
}

// ---------- Submissions (field workers) ----------

export async function createSubmissionAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect('/login');

  const settings = await getSettings();
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

  await run(
    `INSERT INTO submissions (user_id, nama, tanggal_lembur, jam_mulai, jam_selesai, pekerjaan)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [session!.id, nama, tanggal_lembur, jam_mulai, jam_selesai, pekerjaan]
  );

  revalidatePath('/form');
  redirect('/form?ok=1');
}

export async function deleteSubmissionAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect('/login');

  const id = Number(formData.get('id'));
  const submission = await queryOne<{ user_id: number }>(
    `SELECT user_id FROM submissions WHERE id = ?`,
    [id]
  );

  if (!submission) redirect('/form');
  if (submission!.user_id !== session!.id && session!.role !== 'admin') {
    redirect('/form');
  }

  await run(`DELETE FROM submissions WHERE id = ?`, [id]);
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
    await run(`INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)`, [
      username,
      hash,
      full_name,
      role,
    ]);
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
  await run(`UPDATE users SET password_hash = ? WHERE id = ?`, [hash, id]);

  revalidatePath('/admin/users');
  redirect('/admin/users?ok=reset');
}

export async function deleteUserAction(formData: FormData) {
  const admin = await requireAdmin();

  const id = Number(formData.get('id'));
  if (id === admin!.id) {
    redirect('/admin/users?error=self_delete');
  }

  const target = await queryOne<{ role: string }>(`SELECT role FROM users WHERE id = ?`, [id]);

  if (target?.role === 'admin') {
    const adminCountRow = await queryOne<{ c: number }>(
      `SELECT COUNT(*) as c FROM users WHERE role = 'admin'`
    );
    if (Number(adminCountRow?.c ?? 0) <= 1) {
      redirect('/admin/users?error=last_admin');
    }
  }

  await run(`DELETE FROM users WHERE id = ?`, [id]);
  revalidatePath('/admin/users');
  redirect('/admin/users?ok=deleted');
}

// ---------- Admin: settings (cutoff window) ----------

export async function updateSettingsAction(formData: FormData) {
  await requireAdmin();

  const is_open = formData.get('is_open') === 'on';
  const cutoff_at = String(formData.get('cutoff_at') ?? '').trim();

  await updateSettings({ is_open, cutoff_at });

  revalidatePath('/admin/settings');
  revalidatePath('/form');
  redirect('/admin/settings?ok=1');
}
