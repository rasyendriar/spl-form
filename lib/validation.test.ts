import { describe, expect, it } from 'vitest';
import { validateSubmissionBlocks, type ValidationBlock } from './validation';

function block(overrides: Partial<ValidationBlock> = {}): ValidationBlock {
  return {
    people: [{ nik: '123', nama: 'Budi' }],
    pekerjaan: 'Perbaikan mesin',
    jamMulai: '08:00',
    jamSelesai: '10:00',
    ...overrides,
  };
}

describe('validateSubmissionBlocks', () => {
  it('accepts a single fully-filled block', () => {
    const result = validateSubmissionBlocks([block()], '2026-09-20');
    expect(result.valid).toBe(true);
  });

  it('rejects an empty tanggal_lembur', () => {
    const result = validateSubmissionBlocks([block()], '');
    expect(result).toEqual({ valid: false, reason: 'empty', blockErrors: [] });
  });

  it('rejects when there is no named person anywhere', () => {
    const result = validateSubmissionBlocks(
      [block({ people: [{ nik: null, nama: '' }] })],
      '2026-09-20'
    );
    expect(result).toEqual({ valid: false, reason: 'empty', blockErrors: [] });
  });

  it('silently skips a block with no named person, without erroring on its other fields', () => {
    const emptyBlock = block({
      people: [{ nik: null, nama: '' }],
      pekerjaan: '',
      jamMulai: '',
      jamSelesai: '',
    });
    const result = validateSubmissionBlocks([emptyBlock, block()], '2026-09-20');
    expect(result.valid).toBe(true);
  });

  it('flags a block missing pekerjaan', () => {
    const result = validateSubmissionBlocks([block({ pekerjaan: '  ' })], '2026-09-20');
    expect(result).toEqual({
      valid: false,
      reason: 'invalid_block',
      blockErrors: [{ blockIndex: 0, field: 'pekerjaan', message: 'Pekerjaan wajib diisi.' }],
    });
  });

  it('flags a block with an invalid jam mulai/selesai', () => {
    const result = validateSubmissionBlocks(
      [block({ jamMulai: '', jamSelesai: '25:99' })],
      '2026-09-20'
    );
    expect(result.valid).toBe(false);
    if (!result.valid && result.reason === 'invalid_block') {
      expect(result.blockErrors).toEqual([
        { blockIndex: 0, field: 'jamMulai', message: 'Jam mulai wajib diisi.' },
        { blockIndex: 0, field: 'jamSelesai', message: 'Jam selesai wajib diisi.' },
      ]);
    } else {
      throw new Error('expected invalid_block reason');
    }
  });

  it('reports the correct blockIndex when only one of several blocks is invalid', () => {
    const result = validateSubmissionBlocks(
      [block(), block({ jamSelesai: '' }), block()],
      '2026-09-20'
    );
    expect(result.valid).toBe(false);
    if (!result.valid && result.reason === 'invalid_block') {
      expect(result.blockErrors).toHaveLength(1);
      expect(result.blockErrors[0].blockIndex).toBe(1);
    } else {
      throw new Error('expected invalid_block reason');
    }
  });

  it('treats a person with only whitespace as unnamed', () => {
    const result = validateSubmissionBlocks(
      [block({ people: [{ nik: null, nama: '   ' }] })],
      '2026-09-20'
    );
    expect(result).toEqual({ valid: false, reason: 'empty', blockErrors: [] });
  });
});
