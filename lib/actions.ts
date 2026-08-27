'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { queryOne, run, runBatch } from './db';
import { createSession, destroySession, getSession } from './session';
import { getSettings, isFormOpen, updateSettings } from './settings';
import { isValidHHMM } from './utils';

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

type SubmissionPerson = { nik: string | null; nama: string };
type SubmissionBlock = {
  people: SubmissionPerson[];
  pekerjaan: string;
  jamMulai: string;
  jamSelesai: string;
};

export async function createSubmissionAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect('/login');

  const settings = await getSettings();
  if (!isFormOpen(settings)) {
    redirect('/form?error=closed');
  }

  const tanggal_lembur = String(formData.get('tanggal_lembur') ?? '').trim();
  if (!tanggal_lembur) {
    redirect('/form?error=empty');
  }

  let rawBlocks: unknown;
  try {
    rawBlocks = JSON.parse(String(formData.get('blocks_json') ?? '[]'));
  } catch {
    redirect('/form?error=empty');
  }

  if (!Array.isArray(rawBlocks)) {
    redirect('/form?error=empty');
  }

  const rowsToInsert: {
    nik: string | null;
    nama: string;
    pekerjaan: string;
    jamMulai: string;
    jamSelesai: string;
  }[] = [];

  for (const raw of rawBlocks as SubmissionBlock[]) {
    const people = Array.isArray(raw?.people)
      ? raw.people
          .map((p) => ({
            nik: p?.nik ? String(p.nik).trim() : null,
            nama: String(p?.nama ?? '').trim(),
          }))
          .filter((p) => p.nama)
      : [];
    if (people.length === 0) continue; // blok kosong, lewati saja

    const pekerjaan = String(raw?.pekerjaan ?? '').trim();
    const jamMulai = String(raw?.jamMulai ?? '').trim();
    const jamSelesai = String(raw?.jamSelesai ?? '').trim();

    if (!pekerjaan || !isValidHHMM(jamMulai) || !isValidHHMM(jamSelesai)) {
      redirect('/form?error=invalid_block');
    }

    for (const person of people) {
      rowsToInsert.push({ nik: person.nik, nama: person.nama, pekerjaan, jamMulai, jamSelesai });
    }
  }

  if (rowsToInsert.length === 0) {
    redirect('/form?error=empty');
  }

  await runBatch(
    rowsToInsert.map((row) => ({
      sql: `INSERT INTO submissions (user_id, nik, nama, tanggal_lembur, jam_mulai, jam_selesai, pekerjaan)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        session!.id,
        row.nik,
        row.nama,
        tanggal_lembur,
        row.jamMulai,
        row.jamSelesai,
        row.pekerjaan,
      ],
    }))
  );

  revalidatePath('/form');
  revalidatePath('/admin/submissions');
  revalidatePath('/admin/dashboard');
  redirect(`/form?ok=1&count=${rowsToInsert.length}`);
}

export async function deleteSubmissionAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect('/login');

  const id = Number(formData.get('id'));
  const submission = await queryOne<{ user_id: number; status: string }>(
    `SELECT user_id, status FROM submissions WHERE id = ?`,
    [id]
  );

  if (!submission) redirect('/form');
  if (submission!.user_id !== session!.id && session!.role !== 'admin') {
    redirect('/form');
  }
  if (session!.role !== 'admin' && submission!.status !== 'pending') {
    redirect('/form?error=locked');
  }

  await run(`DELETE FROM submissions WHERE id = ?`, [id]);
  revalidatePath('/form');
  revalidatePath('/admin/submissions');
  revalidatePath('/admin/dashboard');

  if (session!.role === 'admin') {
    redirect('/admin/submissions?ok=deleted');
  }
  redirect('/form?ok=deleted');
}

// ---------- Admin: edit submission ----------

export async function updateSubmissionAction(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get('id'));
  const nik = String(formData.get('nik') ?? '').trim() || null;
  const nama = String(formData.get('nama') ?? '').trim();
  const tanggal_lembur = String(formData.get('tanggal_lembur') ?? '').trim();
  const jam_mulai = String(formData.get('jam_mulai') ?? '').trim();
  const jam_selesai = String(formData.get('jam_selesai') ?? '').trim();
  const pekerjaan = String(formData.get('pekerjaan') ?? '').trim();

  if (
    !id ||
    !nama ||
    !tanggal_lembur ||
    !isValidHHMM(jam_mulai) ||
    !isValidHHMM(jam_selesai) ||
    !pekerjaan
  ) {
    redirect(`/admin/submissions/${id}/edit?error=invalid`);
  }

  await run(
    `UPDATE submissions SET nik = ?, nama = ?, tanggal_lembur = ?, jam_mulai = ?, jam_selesai = ?, pekerjaan = ?
     WHERE id = ?`,
    [nik, nama, tanggal_lembur, jam_mulai, jam_selesai, pekerjaan, id]
  );

  revalidatePath('/admin/submissions');
  revalidatePath('/admin/dashboard');
  redirect('/admin/submissions?ok=updated');
}

// ---------- Admin: approval ----------

export async function approveSubmissionAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = Number(formData.get('id'));

  await run(
    `UPDATE submissions SET status = 'approved', reviewed_by = ?, reviewed_at = datetime('now'), review_note = NULL
     WHERE id = ?`,
    [admin!.id, id]
  );

  revalidatePath('/admin/submissions');
  revalidatePath('/admin/dashboard');
  revalidatePath('/form');
  redirect('/admin/submissions?ok=approved');
}

export async function rejectSubmissionAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = Number(formData.get('id'));
  const note = String(formData.get('note') ?? '').trim();

  await run(
    `UPDATE submissions SET status = 'rejected', reviewed_by = ?, reviewed_at = datetime('now'), review_note = ?
     WHERE id = ?`,
    [admin!.id, note || null, id]
  );

  revalidatePath('/admin/submissions');
  revalidatePath('/admin/dashboard');
  revalidatePath('/form');
  redirect('/admin/submissions?ok=rejected');
}

export async function resetSubmissionStatusAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));

  await run(
    `UPDATE submissions SET status = 'pending', reviewed_by = NULL, reviewed_at = NULL, review_note = NULL
     WHERE id = ?`,
    [id]
  );

  revalidatePath('/admin/submissions');
  revalidatePath('/admin/dashboard');
  revalidatePath('/form');
  redirect('/admin/submissions?ok=reset');
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

// ---------- Admin: settings (cut off harian) ----------

export async function updateSettingsAction(formData: FormData) {
  await requireAdmin();

  const is_open = formData.get('is_open') === 'on';
  const weekday_cutoff_time = String(formData.get('weekday_cutoff_time') ?? '').trim();
  const saturday_cutoff_time = String(formData.get('saturday_cutoff_time') ?? '').trim();
  const sunday_cutoff_time = String(formData.get('sunday_cutoff_time') ?? '').trim();

  if (
    !isValidHHMM(weekday_cutoff_time) ||
    !isValidHHMM(saturday_cutoff_time) ||
    !isValidHHMM(sunday_cutoff_time)
  ) {
    redirect('/admin/settings?error=invalid');
  }

  await updateSettings({
    is_open,
    weekday_cutoff_time,
    saturday_cutoff_time,
    sunday_cutoff_time,
  });

  revalidatePath('/admin/settings');
  revalidatePath('/form');
  redirect('/admin/settings?ok=1');
}

// ---------- Admin: kelola data karyawan ----------

export async function createEmployeeAction(formData: FormData) {
  await requireAdmin();

  const nik = String(formData.get('nik') ?? '').trim();
  const nama = String(formData.get('nama') ?? '').trim();
  const section = String(formData.get('section') ?? '').trim();
  const position = String(formData.get('position') ?? '').trim();
  const grup = String(formData.get('grup') ?? '').trim();

  if (!nik || !nama) {
    redirect('/admin/employees?error=invalid');
  }

  try {
    await run(
      `INSERT INTO employees (nik, nama, section, position, grup) VALUES (?, ?, ?, ?, ?)`,
      [nik, nama, section, position, grup]
    );
  } catch (e: any) {
    if (String(e?.message ?? '').includes('UNIQUE')) {
      redirect('/admin/employees?error=exists');
    }
    throw e;
  }

  revalidatePath('/admin/employees');
  redirect('/admin/employees?ok=created');
}

export async function updateEmployeeAction(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get('id'));
  const nik = String(formData.get('nik') ?? '').trim();
  const nama = String(formData.get('nama') ?? '').trim();
  const section = String(formData.get('section') ?? '').trim();
  const position = String(formData.get('position') ?? '').trim();
  const grup = String(formData.get('grup') ?? '').trim();

  if (!id || !nik || !nama) {
    redirect('/admin/employees?error=invalid');
  }

  try {
    await run(
      `UPDATE employees SET nik = ?, nama = ?, section = ?, position = ?, grup = ? WHERE id = ?`,
      [nik, nama, section, position, grup, id]
    );
  } catch (e: any) {
    if (String(e?.message ?? '').includes('UNIQUE')) {
      redirect('/admin/employees?error=exists');
    }
    throw e;
  }

  revalidatePath('/admin/employees');
  redirect('/admin/employees?ok=updated');
}

export async function deleteEmployeeAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  await run(`DELETE FROM employees WHERE id = ?`, [id]);
  revalidatePath('/admin/employees');
  redirect('/admin/employees?ok=deleted');
}

export async function bulkImportEmployeesAction(formData: FormData) {
  await requireAdmin();

  const raw = String(formData.get('bulk_data') ?? '');
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const rows: { nik: string; nama: string; section: string; position: string; grup: string }[] = [];
  for (const line of lines) {
    const cols = line.split('\t').map((c) => c.trim());
    const [nik, nama, section = '', position = '', grup = ''] = cols;
    if (nik && nama) {
      rows.push({ nik, nama, section, position, grup });
    }
  }

  if (rows.length === 0) {
    redirect('/admin/employees?error=empty_bulk');
  }

  await runBatch(
    rows.map((r) => ({
      sql: `INSERT INTO employees (nik, nama, section, position, grup) VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(nik) DO UPDATE SET nama = excluded.nama, section = excluded.section,
              position = excluded.position, grup = excluded.grup`,
      args: [r.nik, r.nama, r.section, r.position, r.grup],
    }))
  );

  revalidatePath('/admin/employees');
  redirect(`/admin/employees?ok=imported&count=${rows.length}`);
}
