import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { queryAll } from '@/lib/db';
import { getSession } from '@/lib/session';
import { overlappingBreakWindows } from '@/lib/utils';

type Row = {
  nik: string | null;
  nama: string;
  tanggal_lembur: string;
  jam_mulai: string;
  jam_selesai: string;
  pekerjaan: string;
};

function toDotTime(hhmm: string): string {
  return hhmm.replace(':', '.');
}

function toDDMMYYYY(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || '';
  const includeAll = searchParams.get('all') === '1';

  if (!date) {
    return NextResponse.json({ error: 'Tanggal wajib diisi' }, { status: 400 });
  }

  const rows = await queryAll<Row>(
    `SELECT nik, nama, tanggal_lembur, jam_mulai, jam_selesai, pekerjaan
     FROM submissions
     WHERE tanggal_lembur = ? ${includeAll ? '' : "AND status = 'approved'"}
     ORDER BY nama ASC`,
    [date]
  );

  // Header rows replicate the merged-cell layout of the internal template:
  // BARCODE | NAMA | TANGGAL | POSISI | JAM LEMBUR (AWAL/AKHIR) | JAM IST 1 (AWAL/AKHIR) |
  // JAM IST 2 (AWAL/AKHIR) | AKTIVITAS
  const header1 = [
    'BARCODE',
    'NAMA',
    'TANGGAL',
    'POSISI (AWAL / AKHIR / ISTIRAHAT)',
    'JAM LEMBUR',
    '',
    'JAM IST 1',
    '',
    'JAM IST 2',
    '',
    'AKTIVITAS',
  ];
  const header2 = ['', '', '', '', 'AWAL', 'AKHIR', 'AWAL', 'AKHIR', 'AWAL', 'AKHIR', ''];

  const dataRows = rows.map((r) => {
    const breaks = overlappingBreakWindows(r.jam_mulai, r.jam_selesai);
    const ist1 = breaks[0];
    const ist2 = breaks[1];
    return [
      r.nik ?? '',
      r.nama,
      toDDMMYYYY(r.tanggal_lembur),
      '',
      toDotTime(r.jam_mulai),
      toDotTime(r.jam_selesai),
      ist1 ? toDotTime(ist1.start) : '',
      ist1 ? toDotTime(ist1.end) : '',
      ist2 ? toDotTime(ist2.start) : '',
      ist2 ? toDotTime(ist2.end) : '',
      r.pekerjaan,
    ];
  });

  const aoa = [header1, header2, ...dataRows];
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);

  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, // A1:A2 BARCODE
    { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, // B1:B2 NAMA
    { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } }, // C1:C2 TANGGAL
    { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } }, // D1:D2 POSISI
    { s: { r: 0, c: 4 }, e: { r: 0, c: 5 } }, // E1:F1 JAM LEMBUR
    { s: { r: 0, c: 6 }, e: { r: 0, c: 7 } }, // G1:H1 JAM IST 1
    { s: { r: 0, c: 8 }, e: { r: 0, c: 9 } }, // I1:J1 JAM IST 2
    { s: { r: 0, c: 10 }, e: { r: 1, c: 10 } }, // K1:K2 AKTIVITAS
  ];

  worksheet['!cols'] = [
    { wch: 15 },
    { wch: 30 },
    { wch: 12 },
    { wch: 22 },
    { wch: 9 },
    { wch: 9 },
    { wch: 9 },
    { wch: 9 },
    { wch: 9 },
    { wch: 9 },
    { wch: 45 },
  ];
  worksheet['!rows'] = [{ hpt: 28 }, { hpt: 20 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Lembur Harian');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="lembur-harian-${date}.xlsx"`,
    },
  });
}
