import { describe, it, expect } from 'vitest';
import { parseDateOnly } from '../date';

describe('parseDateOnly', () => {
  it('should parse YYYY-MM-DD correctly', () => {
    expect(parseDateOnly('2026-09-22')).toBe('2026-09-22');
  });

  it('should extract date from ISO string', () => {
    expect(parseDateOnly('2026-09-22T19:00:23.000Z')).toBe('2026-09-22');
  });

  it('should convert Brazilian format DD/MM/YYYY to YYYY-MM-DD', () => {
    expect(parseDateOnly('22/09/2026')).toBe('2026-09-22');
    expect(parseDateOnly('05/01/2026')).toBe('2026-01-05');
  });

  it('should convert Brazilian format with time DD/MM/YYYY HH:mm:ss to YYYY-MM-DD', () => {
    expect(parseDateOnly('22/09/2026 14:30:00')).toBe('2026-09-22');
  });

  it('should handle Date object', () => {
    const d = new Date('2026-09-22T00:00:00.000Z');
    expect(parseDateOnly(d)).toBe('2026-09-22');
  });

  it('should return null for empty string or whitespace', () => {
    expect(parseDateOnly('')).toBeNull();
    expect(parseDateOnly('   ')).toBeNull();
  });

  it('should return null for null or undefined', () => {
    expect(parseDateOnly(null)).toBeNull();
    expect(parseDateOnly(undefined)).toBeNull();
    expect(parseDateOnly()).toBeNull();
  });

  it('should return null for "0000-00-00" and "Invalid date"', () => {
    expect(parseDateOnly('0000-00-00')).toBeNull();
    expect(parseDateOnly('Invalid date')).toBeNull();
  });

  it('should return null for invalid date strings', () => {
    expect(parseDateOnly('abc-not-a-date')).toBeNull();
    expect(parseDateOnly(new Date('invalid'))).toBeNull();
  });
});
