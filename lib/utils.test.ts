import { describe, expect, it } from 'vitest';
import {
  formatHoursNumber,
  grossPayMinutes,
  isValidHHMM,
  parseDurationMinutes,
  rawSpanMinutes,
  shiftDateStr,
} from './utils';

describe('isValidHHMM', () => {
  it('accepts valid 24h times', () => {
    expect(isValidHHMM('00:00')).toBe(true);
    expect(isValidHHMM('23:59')).toBe(true);
    expect(isValidHHMM('08:05')).toBe(true);
  });

  it('rejects invalid or empty values', () => {
    expect(isValidHHMM('')).toBe(false);
    expect(isValidHHMM('24:00')).toBe(false);
    expect(isValidHHMM('12:60')).toBe(false);
    expect(isValidHHMM('8:00')).toBe(false);
  });
});

describe('parseDurationMinutes', () => {
  it('subtracts the break window that overlaps the range', () => {
    // 12:00-14:00 overlaps the 12:30-13:30 break window (60 min break)
    expect(parseDurationMinutes('12:00', '14:00')).toBe(60);
  });

  it('handles a range crossing midnight', () => {
    expect(parseDurationMinutes('23:00', '01:00')).toBe(120);
  });
});

describe('grossPayMinutes', () => {
  it('applies flat 2x on Sunday', () => {
    // 2026-09-20 is a Sunday
    expect(grossPayMinutes(120, '2026-09-20')).toBe(240);
  });

  it('applies 1.5x for the first hour and 2x for the rest on a weekday', () => {
    // 2026-09-21 is a Monday: 90 min net -> 60*1.5 + 30*2 = 150
    expect(grossPayMinutes(90, '2026-09-21')).toBe(150);
  });

  it('applies flat 2x on Saturday for a Staff employee who did not piket', () => {
    // 2026-09-19 is a Saturday
    expect(grossPayMinutes(120, '2026-09-19', false)).toBe(240);
  });

  it('applies the standard weekday-style tiers on Saturday for a piket Staff employee', () => {
    expect(grossPayMinutes(90, '2026-09-19', true)).toBe(150);
  });
});

describe('rawSpanMinutes edge case: identical start/end', () => {
  it('previously silently treated equal jam mulai/selesai as a near-24h span', () => {
    // Documents why lib/validation.ts explicitly rejects jamMulai === jamSelesai:
    // left unguarded, this function alone would report a full 24-hour shift.
    expect(rawSpanMinutes('08:00', '08:00')).toBe(24 * 60);
  });
});

describe('shiftDateStr', () => {
  it('shifts forward and backward within a month', () => {
    expect(shiftDateStr('2026-09-20', 1)).toBe('2026-09-21');
    expect(shiftDateStr('2026-09-20', -1)).toBe('2026-09-19');
  });

  it('rolls over month and year boundaries', () => {
    expect(shiftDateStr('2026-09-30', 1)).toBe('2026-10-01');
    expect(shiftDateStr('2026-01-01', -1)).toBe('2025-12-31');
  });
});

describe('formatHoursNumber', () => {
  it('formats whole hours without a decimal', () => {
    expect(formatHoursNumber(120)).toBe('2');
  });

  it('formats fractional hours with a comma', () => {
    expect(formatHoursNumber(330)).toBe('5,5');
  });
});
