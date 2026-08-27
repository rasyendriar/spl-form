export function formatDuration(jamMulai: string, jamSelesai: string): string {
  const [h1, m1] = jamMulai.split(':').map(Number);
  const [h2, m2] = jamSelesai.split(':').map(Number);
  const start = h1 * 60 + m1;
  let end = h2 * 60 + m2;
  if (end <= start) end += 24 * 60;
  const diff = end - start;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h === 0) return `${m} menit`;
  return m ? `${h} jam ${m} menit` : `${h} jam`;
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
