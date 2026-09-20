import { isValidHHMM } from './utils';

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
  | { valid: false; reason: 'invalid_block'; blockErrors: BlockFieldError[] };

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
  tanggalLembur: string
): SubmissionValidation {
  if (!tanggalLembur.trim()) {
    return { valid: false, reason: 'empty', blockErrors: [] };
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
    if (!isValidHHMM(block.jamMulai)) {
      blockErrors.push({ blockIndex, field: 'jamMulai', message: 'Jam mulai wajib diisi.' });
    }
    if (!isValidHHMM(block.jamSelesai)) {
      blockErrors.push({ blockIndex, field: 'jamSelesai', message: 'Jam selesai wajib diisi.' });
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
