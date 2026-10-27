import { describe, it, expect } from 'vitest';
import {
  toMinorUnit,
  toDecimalUnit,
  formatCurrency,
  isValidAmountMinor,
  isValidBalanceMinor,
  assertSameCurrency
} from '../src/utils/money.js';

describe('Financial Money Utilities (Paise & Minor Units)', () => {
  it('converts decimal amounts to minor units (paise) accurately without floating point drift', () => {
    expect(toMinorUnit(100.5, 'INR')).toBe(10050);
    expect(toMinorUnit('150.75', 'INR')).toBe(15075);
    expect(toMinorUnit('0.01', 'INR')).toBe(1);
    expect(toMinorUnit('1000', 'INR')).toBe(100000);
    expect(toMinorUnit('0.99', 'USD')).toBe(99);
    expect(toMinorUnit('500', 'JPY')).toBe(500); // 0 decimals
  });

  it('converts minor units back to decimal string accurately', () => {
    expect(toDecimalUnit(10050, 'INR')).toBe('100.50');
    expect(toDecimalUnit(15075, 'INR')).toBe('150.75');
    expect(toDecimalUnit(1, 'INR')).toBe('0.01');
    expect(toDecimalUnit(500, 'JPY')).toBe('500');
  });

  it('formats minor units for human presentation with currency symbols', () => {
    const formattedInr = formatCurrency(15075, 'INR', 'en-IN');
    expect(formattedInr).toContain('150.75');
  });

  it('validates safe integer amount boundaries', () => {
    expect(isValidAmountMinor(100)).toBe(true);
    expect(isValidAmountMinor(0)).toBe(false); // must be >= minAmountMinor (1)
    expect(isValidAmountMinor(-50)).toBe(false);
    expect(isValidAmountMinor(1.5)).toBe(false);
    expect(isValidAmountMinor(999999999999999999)).toBe(false); // exceeds safe bounds
  });

  it('validates safe balance minor boundaries', () => {
    expect(isValidBalanceMinor(0)).toBe(true);
    expect(isValidBalanceMinor(-5000)).toBe(true); // credit card negative balance
    expect(isValidBalanceMinor(100000)).toBe(true);
  });

  it('prevents silent mixing of different currencies', () => {
    expect(() => assertSameCurrency('INR', 'USD', 'transfer')).toThrow('Currency mismatch');
    expect(() => assertSameCurrency('INR', 'INR', 'transfer')).not.toThrow();
  });
});
