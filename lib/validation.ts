import { isValidHHMM, rawSpanMinutes, shiftDateStr, MAX_OVERTIME_SPAN_MINUTES } from './utils';

export type ValidationPerson = { nik: string | null; nama: string; piket?: boolean | null };

export type ValidationBlock = {
  people: ValidationPerson[];
  pekerjaan: string;
  jamMulai: string;
  jamSelesai: string;
};

export type BlockFieldError = {
  blockIndex: number;
  field: 'pekerjaan' | 'jamMulai' | 'jamSelesai';
  message: string;
};

export type SubmissionValidation =
  | { valid: true }
  | { valid: false; reason: 'empty'; blockErrors: [] }
  | { valid: false; reason: 'date_out_of_range'; blockErrors: [] }
  | { valid: false; reason: 'invalid_block'; blockErrors: BlockFieldError[] };

/** Tanggal SPL cuma boleh H-1, hari ini, atau H+1 — relatif ke `todayStr` (WIB). */
export function isDateWithinSubmissionWindow(dateStr: string, todayStr: string): boolean {
  const min = shiftDateStr(todayStr, -1);
  const max = shiftDateStr(todayStr, 1);
  return dateStr >= min && dateStr <= max;
}

/**
 * Single source of truth for what makes a lembur submission valid, shared by
 * the client form (to block a submit before it ever reaches the server, so a
 * mistake in one block doesn't wipe out everything the user typed) and the
 * server action (as the trust boundary, in case JS is disabled or the
 * payload is tampered with). A block with no named person is treated as an
 * intentionally-empty extra block and skipped, matching how the server
 * historically ignored those rows.
 */
export function validateSubmissionBlocks(
  blocks: ValidationBlock[],
  tanggalLembur: string,
  todayStr: string
): SubmissionValidation {
  if (!tanggalLembur.trim()) {
    return { valid: false, reason: 'empty', blockErrors: [] };
  }

  if (!isDateWithinSubmissionWindow(tanggalLembur, todayStr)) {
    return { valid: false, reason: 'date_out_of_range', blockErrors: [] };
  }

  const blockErrors: BlockFieldError[] = [];
  let nonEmptyBlockCount = 0;

  blocks.forEach((block, blockIndex) => {
    const hasPerson = block.people.some((p) => p.nama.trim());
    if (!hasPerson) return;

    nonEmptyBlockCount += 1;

    if (!block.pekerjaan.trim()) {
      blockErrors.push({ blockIndex, field: 'pekerjaan', message: 'Pekerjaan wajib diisi.' });
    }

    const validMulai = isValidHHMM(block.jamMulai);
    const validSelesai = isValidHHMM(block.jamSelesai);
    if (!validMulai) {
      blockErrors.push({ blockIndex, field: 'jamMulai', message: 'Jam mulai wajib diisi.' });
    }
    if (!validSelesai) {
      blockErrors.push({ blockIndex, field: 'jamSelesai', message: 'Jam selesai wajib diisi.' });
    }

    if (validMulai && validSelesai) {
      if (block.jamMulai === block.jamSelesai) {
        blockErrors.push({
          blockIndex,
          field: 'jamSelesai',
          message: 'Jam mulai dan jam selesai tidak boleh sama.',
        });
      } else if (rawSpanMinutes(block.jamMulai, block.jamSelesai) > MAX_OVERTIME_SPAN_MINUTES) {
        blockErrors.push({
          blockIndex,
          field: 'jamSelesai',
          message: 'Durasi lembur kepanjangan, cek lagi jam mulai/selesainya.',
        });
      }
    }
  });

  if (nonEmptyBlockCount === 0) {
    return { valid: false, reason: 'empty', blockErrors: [] };
  }

  if (blockErrors.length > 0) {
    return { valid: false, reason: 'invalid_block', blockErrors };
  }

  return { valid: true };
}
