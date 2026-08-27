export function parseDurationMinutes(jamMulai: string, jamSelesai: string): number {
  const [h1, m1] = jamMulai.split(':').map(Number);
  const [h2, m2] = jamSelesai.split(':').map(Number);
  const start = h1 * 60 + m1;
  let end = h2 * 60 + m2;
  if (end <= start) end += 24 * 60;
  return end - start;
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
