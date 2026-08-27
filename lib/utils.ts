/**
 * Jam istirahat tetap perusahaan — waktu yang tumpang tindih dengan jendela ini
 * otomatis tidak dihitung sebagai jam lembur.
 */
export const BREAK_WINDOWS: { start: string; end: string; startMin: number; endMin: number }[] = [
  { start: '12:30', end: '13:30', startMin: 12 * 60 + 30, endMin: 13 * 60 + 30 },
  { start: '17:30', end: '18:30', startMin: 17 * 60 + 30, endMin: 18 * 60 + 30 },
];

function toMinutesOfDay(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function overlapMinutes(aStart: number, aEnd: number, bStart: number, bEnd: number): number {
  return Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart));
}

/** Rentang jam kerja mentah (belum dikurangi istirahat), dalam menit. */
export function rawSpanMinutes(jamMulai: string, jamSelesai: string): number {
  const start = toMinutesOfDay(jamMulai);
  let end = toMinutesOfDay(jamSelesai);
  if (end <= start) end += 24 * 60;
  return end - start;
}

/** Total menit istirahat (dari BREAK_WINDOWS) yang tumpang tindih dengan rentang lembur. */
export function breakOverlapMinutes(jamMulai: string, jamSelesai: string): number {
  const start = toMinutesOfDay(jamMulai);
  let end = toMinutesOfDay(jamSelesai);
  if (end <= start) end += 24 * 60;

  let total = 0;
  for (const w of BREAK_WINDOWS) {
    // cek jendela istirahat hari ini, dan versi +24 jam untuk lembur yang lewat tengah malam
    total += overlapMinutes(start, end, w.startMin, w.endMin);
    total += overlapMinutes(start, end, w.startMin + 24 * 60, w.endMin + 24 * 60);
  }
  return total;
}

/** Jendela istirahat mana saja (dari BREAK_WINDOWS) yang benar-benar tumpang tindih dengan rentang lembur ini. */
export function overlappingBreakWindows(
  jamMulai: string,
  jamSelesai: string
): { start: string; end: string }[] {
  const start = toMinutesOfDay(jamMulai);
  let end = toMinutesOfDay(jamSelesai);
  if (end <= start) end += 24 * 60;

  return BREAK_WINDOWS.filter(
    (w) =>
      overlapMinutes(start, end, w.startMin, w.endMin) > 0 ||
      overlapMinutes(start, end, w.startMin + 24 * 60, w.endMin + 24 * 60) > 0
  );
}

/** Durasi lembur bersih (menit) — jam mentah dikurangi jam istirahat yang tumpang tindih. */
export function parseDurationMinutes(jamMulai: string, jamSelesai: string): number {
  const raw = rawSpanMinutes(jamMulai, jamSelesai);
  const breakMinutes = breakOverlapMinutes(jamMulai, jamSelesai);
  return Math.max(0, raw - breakMinutes);
}

/**
 * Jam kotor (dasar pembayaran gaji). Aturan:
 * - Minggu: seluruh durasi bersih dikali 2 (flat, tanpa tingkatan jam pertama).
 * - Senin-Sabtu (standar): 1 jam pertama dikali 1,5, sisanya dikali 2.
 * - Khusus Sabtu untuk posisi Staff yang TIDAK piket: berlaku seperti Minggu
 *   (flat dikali 2). Staff yang piket, atau posisi non-Staff, tetap pakai
 *   aturan standar Senin-Sabtu.
 *
 * `piket` hanya relevan untuk lembur hari Sabtu; abaikan (null/undefined)
 * untuk hari lain atau untuk posisi non-Staff.
 * Input & output dalam menit (output sudah dikali pengali, jadi bisa > durasi bersih).
 */
export function grossPayMinutes(
  netMinutes: number,
  tanggalLembur: string,
  piket?: boolean | null
): number {
  const day = dayOfWeek(tanggalLembur);
  const isSunday = day === 0;
  const isSaturday = day === 6;
  const flatDoubleRate = isSunday || (isSaturday && piket === false);

  if (flatDoubleRate) {
    return netMinutes * 2;
  }

  const firstPortion = Math.min(netMinutes, 60);
  const remaining = Math.max(netMinutes - 60, 0);
  return firstPortion * 1.5 + remaining * 2;
}

export function formatDuration(jamMulai: string, jamSelesai: string): string {
  return formatMinutesLong(parseDurationMinutes(jamMulai, jamSelesai));
}

export function formatMinutesLong(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h === 0) return `${m} menit`;
  return m ? `${h} jam ${m} menit` : `${h} jam`;
}

export function formatMinutesCompact(totalMinutes: number): string {
  const hours = totalMinutes / 60;
  const rounded = Math.round(hours * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace('.', ',');
  return `${text} jam`;
}

export function formatDateID(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShortID(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export function formatDateTimeID(value: string): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
}

export function todayInputValue(): string {
  const now = new Date();
  const tzOffsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

/** 0=Sunday ... 6=Saturday, computed from a 'YYYY-MM-DD' date string. */
export function dayOfWeek(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00`).getDay();
}

export function isSaturdayDate(dateStr: string): boolean {
  return dayOfWeek(dateStr) === 6;
}

export function isValidHHMM(value: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

export function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** Given 'YYYY-MM', returns the inclusive date range as 'YYYY-MM-DD' strings. */
export function monthRange(month: string): { start: string; end: string } {
  const [yearStr, monthStr] = month.split('-');
  const year = Number(yearStr);
  const mIndex = Number(monthStr) - 1;
  const start = `${yearStr}-${monthStr}-01`;
  const lastDay = new Date(year, mIndex + 1, 0).getDate();
  const end = `${yearStr}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

export function shiftMonth(month: string, delta: number): string {
  const [yearStr, monthStr] = month.split('-');
  const date = new Date(Number(yearStr), Number(monthStr) - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonthLabelID(month: string): string {
  const [yearStr, monthStr] = month.split('-');
  const date = new Date(Number(yearStr), Number(monthStr) - 1, 1);
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}
