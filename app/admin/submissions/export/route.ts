import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { formatDuration } from '@/lib/utils';

type Row = {
  tanggal_lembur: string;
  nama: string;
  jam_mulai: string;
  jam_selesai: string;
  pekerjaan: string;
  submitted_by: string;
  created_at: string;
};

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';

  let sql = `
    SELECT s.tanggal_lembur, s.nama, s.jam_mulai, s.jam_selesai, s.pekerjaan, s.created_at,
           u.full_name as submitted_by
    FROM submissions s
    JOIN users u ON u.id = s.user_id
  `;
  const conditions: string[] = [];
  const params: string[] = [];
  if (from) {
    conditions.push('s.tanggal_lembur >= ?');
    params.push(from);
  }
  if (to) {
    conditions.push('s.tanggal_lembur <= ?');
    params.push(to);
  }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY s.tanggal_lembur ASC, s.id ASC';

  const rows = db.prepare(sql).all(...params) as Row[];

  const data = rows.map((r) => ({
    Tanggal: r.tanggal_lembur,
    Nama: r.nama,
    'Jam Mulai': r.jam_mulai,
    'Jam Selesai': r.jam_selesai,
    'Durasi': formatDuration(r.jam_mulai, r.jam_selesai),
    Pekerjaan: r.pekerjaan,
    'Akun Pengisi': r.submitted_by,
    'Waktu Pengajuan': r.created_at,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 12 },
    { wch: 24 },
    { wch: 10 },
    { wch: 10 },
    { wch: 14 },
    { wch: 40 },
    { wch: 20 },
    { wch: 20 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Lembur');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  const filenamePart = from || to ? `_${from || 'awal'}_${to || 'akhir'}` : '';

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="rekap-lembur${filenamePart}.xlsx"`,
    },
  });
}
