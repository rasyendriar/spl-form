import { describe, expect, it } from 'vitest';
import { isDateWithinSubmissionWindow, validateSubmissionBlocks, type ValidationBlock } from './validation';

const TODAY = '2026-09-20'; // a Sunday, doesn't matter for these tests

function block(overrides: Partial<ValidationBlock> = {}): ValidationBlock {
  return {
    people: [{ nik: '123', nama: 'Budi' }],
    pekerjaan: 'Perbaikan mesin',
    jamMulai: '08:00',
    jamSelesai: '10:00',
    ...overrides,
  };
}

describe('isDateWithinSubmissionWindow', () => {
  it('accepts today, H-1, and H+1', () => {
    expect(isDateWithinSubmissionWindow('2026-09-19', TODAY)).toBe(true);
    expect(isDateWithinSubmissionWindow('2026-09-20', TODAY)).toBe(true);
    expect(isDateWithinSubmissionWindow('2026-09-21', TODAY)).toBe(true);
  });

  it('rejects anything outside H-1..H+1', () => {
    expect(isDateWithinSubmissionWindow('2026-09-18', TODAY)).toBe(false);
    expect(isDateWithinSubmissionWindow('2026-09-22', TODAY)).toBe(false);
  });

  it('handles a window that crosses a month boundary', () => {
    expect(isDateWithinSubmissionWindow('2026-09-30', '2026-10-01')).toBe(true);
    expect(isDateWithinSubmissionWindow('2026-10-02', '2026-10-01')).toBe(true);
    expect(isDateWithinSubmissionWindow('2026-09-29', '2026-10-01')).toBe(false);
  });
});

describe('validateSubmissionBlocks', () => {
  it('accepts a single fully-filled block', () => {
    const result = validateSubmissionBlocks([block()], TODAY, TODAY);
    expect(result.valid).toBe(true);
  });

  it('rejects an empty tanggal_lembur', () => {
    const result = validateSubmissionBlocks([block()], '', TODAY);
    expect(result).toEqual({ valid: false, reason: 'empty', blockErrors: [] });
  });

  it('rejects a tanggal_lembur outside the H-1..H+1 window', () => {
    const result = validateSubmissionBlocks([block()], '2026-09-25', TODAY);
    expect(result).toEqual({ valid: false, reason: 'date_out_of_range', blockErrors: [] });
  });

  it('rejects when there is no named person anywhere', () => {
    const result = validateSubmissionBlocks(
      [block({ people: [{ nik: null, nama: '' }] })],
      TODAY,
      TODAY
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
    const result = validateSubmissionBlocks([emptyBlock, block()], TODAY, TODAY);
    expect(result.valid).toBe(true);
  });

  it('flags a block missing pekerjaan', () => {
    const result = validateSubmissionBlocks([block({ pekerjaan: '  ' })], TODAY, TODAY);
    expect(result).toEqual({
      valid: false,
      reason: 'invalid_block',
      blockErrors: [{ blockIndex: 0, field: 'pekerjaan', message: 'Pekerjaan wajib diisi.' }],
    });
  });

  it('flags a block with an invalid jam mulai/selesai', () => {
    const result = validateSubmissionBlocks(
      [block({ jamMulai: '', jamSelesai: '25:99' })],
      TODAY,
      TODAY
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

  it('rejects a block where jam mulai equals jam selesai', () => {
    const result = validateSubmissionBlocks(
      [block({ jamMulai: '08:00', jamSelesai: '08:00' })],
      TODAY,
      TODAY
    );
    expect(result).toEqual({
      valid: false,
      reason: 'invalid_block',
      blockErrors: [
        { blockIndex: 0, field: 'jamSelesai', message: 'Jam mulai dan jam selesai tidak boleh sama.' },
      ],
    });
  });

  it('rejects a block whose span is longer than the 16-hour cap', () => {
    // 08:00 -> 23:30 wraps to next-day semantics only past 08:00 itself; use a
    // clearer overnight case: 08:30 start, 07:00 "next day" end -> 22.5 hours.
    const result = validateSubmissionBlocks(
      [block({ jamMulai: '08:30', jamSelesai: '07:00' })],
      TODAY,
      TODAY
    );
    expect(result.valid).toBe(false);
    if (!result.valid && result.reason === 'invalid_block') {
      expect(result.blockErrors).toEqual([
        {
          blockIndex: 0,
          field: 'jamSelesai',
          message: 'Durasi lembur kepanjangan, cek lagi jam mulai/selesainya.',
        },
      ]);
    } else {
      throw new Error('expected invalid_block reason');
    }
  });

  it('accepts a long overnight span right at the 16-hour cap', () => {
    // 08:00 -> next day 00:00 is exactly 16 hours.
    const result = validateSubmissionBlocks(
      [block({ jamMulai: '08:00', jamSelesai: '00:00' })],
      TODAY,
      TODAY
    );
    expect(result.valid).toBe(true);
  });

  it('reports the correct blockIndex when only one of several blocks is invalid', () => {
    const result = validateSubmissionBlocks([block(), block({ jamSelesai: '' }), block()], TODAY, TODAY);
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
      TODAY,
      TODAY
    );
    expect(result).toEqual({ valid: false, reason: 'empty', blockErrors: [] });
  });
});
