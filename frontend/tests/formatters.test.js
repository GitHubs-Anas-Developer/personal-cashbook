import { describe, it, expect } from 'vitest';
import {
  toDecimal,
  toMinor,
  formatMoney,
  formatDate,
  getTransactionTypeColor
} from '../src/utils/formatters.js';

describe('Frontend Formatter Utilities', () => {
  it('converts minor paise to decimal string correctly', () => {
    expect(toDecimal(15075, 'INR')).toBe('150.75');
    expect(toDecimal(100000, 'INR')).toBe('1000.00');
    expect(toDecimal(5, 'INR')).toBe('0.05');
  });

  it('converts decimal string to minor paise integer accurately', () => {
    expect(toMinor('150.75', 'INR')).toBe(15075);
    expect(toMinor('0.01', 'INR')).toBe(1);
    expect(toMinor('100', 'INR')).toBe(10000);
  });

  it('formats currency values for display', () => {
    const formatted = formatMoney(500000, 'INR');
    expect(formatted).toContain('5,000.00');
  });

  it('formats dates consistently', () => {
    const testDate = new Date('2026-10-27T12:00:00Z');
    const formatted = formatDate(testDate);
    expect(formatted).toBeDefined();
    expect(formatted.length).toBeGreaterThan(0);
  });

  it('returns appropriate color classes for transaction types', () => {
    expect(getTransactionTypeColor('income')).toContain('emerald');
    expect(getTransactionTypeColor('expense')).toContain('rose');
    expect(getTransactionTypeColor('transfer')).toContain('indigo');
  });
});
