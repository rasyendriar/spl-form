import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { queryAll } from '@/lib/db';
import { getSession } from '@/lib/session';
import { formatDateTimeID, formatDuration, grossPayMinutes, parseDurationMinutes } from '@/lib/utils';

type Row = {
  nik: string | null;
  tanggal_lembur: string;
  nama: string;
  jam_mulai: string;
  jam_selesai: string;
  pekerjaan: string;
  status: string;
  piket: number | null;
  submitted_by: string;
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
};

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const status = searchParams.get('status') || '';

  let sql = `
    SELECT s.nik, s.tanggal_lembur, s.nama, s.jam_mulai, s.jam_selesai, s.pekerjaan, s.status, s.piket, s.created_at,
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
  if (status && status !== 'all') {
    conditions.push('s.status = ?');
    params.push(status);
  }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY s.tanggal_lembur ASC, s.id ASC';

  const rows = await queryAll<Row>(sql, params);

  const data = rows.map((r) => {
    const netMinutes = parseDurationMinutes(r.jam_mulai, r.jam_selesai);
    const piket = r.piket === null ? null : r.piket === 1;
    return {
      NIK: r.nik ?? '',
      Tanggal: r.tanggal_lembur,
      Nama: r.nama,
      'Jam Mulai': r.jam_mulai,
      'Jam Selesai': r.jam_selesai,
      'Durasi Bersih': formatDuration(r.jam_mulai, r.jam_selesai),
      'Jam Bersih (angka)': Math.round((netMinutes / 60) * 100) / 100,
      'Piket Sabtu': piket === null ? '' : piket ? 'Ya' : 'Tidak',
      'Jam Kotor / Gaji (angka)':
        Math.round((grossPayMinutes(netMinutes, r.tanggal_lembur, piket) / 60) * 100) / 100,
      Pekerjaan: r.pekerjaan,
      Status: STATUS_LABEL[r.status] ?? r.status,
      'Akun Pengisi': r.submitted_by,
      'Waktu Pengajuan': formatDateTimeID(r.created_at),
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 12 },
    { wch: 24 },
    { wch: 10 },
    { wch: 10 },
    { wch: 13 },
    { wch: 14 },
    { wch: 11 },
    { wch: 16 },
    { wch: 40 },
    { wch: 12 },
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
