import { config } from '../config/index.js';

/**
 * Validates whether an amountMinor is a safe integer within permitted bounds.
 * @param {number} amountMinor
 * @returns {boolean}
 */
export function isValidAmountMinor(amountMinor) {
  if (typeof amountMinor !== 'number') return false;
  if (!Number.isSafeInteger(amountMinor)) return false;
  if (amountMinor < config.minAmountMinor) return false;
  if (amountMinor > config.maxAmountMinor) return false;
  return true;
}

/**
 * Validates whether a balance amountMinor (which can be 0 or negative for credit lines) is safe.
 * @param {number} balanceMinor
 * @returns {boolean}
 */
export function isValidBalanceMinor(balanceMinor) {
  if (typeof balanceMinor !== 'number') return false;
  if (!Number.isSafeInteger(balanceMinor)) return false;
  if (Math.abs(balanceMinor) > config.maxAmountMinor) return false;
  return true;
}

/**
 * Converts user decimal input (e.g. 150.75 INR or "150.75") to integer minor units (paise: 15075).
 * Uses exact math to prevent floating point inaccuracies.
 * @param {number|string} decimalAmount
 * @param {string} currency
 * @returns {number}
 */
export function toMinorUnit(decimalAmount, currency = 'INR') {
  if (decimalAmount === null || decimalAmount === undefined || decimalAmount === '') {
    throw new Error('Amount is required');
  }

  const str = String(decimalAmount).trim();
  if (!/^-?\d+(\.\d+)?$/.test(str)) {
    throw new Error(`Invalid numeric amount format: "${decimalAmount}"`);
  }

  const currencyMeta = config.currencies[currency] || config.currencies.INR;
  const decimals = currencyMeta.decimals;

  const [whole, fraction = ''] = str.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  
  const sign = whole.startsWith('-') ? -1 : 1;
  const cleanWhole = whole.replace('-', '');
  
  const combinedStr = `${cleanWhole}${paddedFraction}`;
  const minor = parseInt(combinedStr, 10) * sign;

  if (!Number.isSafeInteger(minor)) {
    throw new Error('Converted amount exceeds safe integer limits');
  }

  return minor;
}

/**
 * Converts minor integer units (e.g. 15075 paise) to decimal string (e.g. "150.75").
 * @param {number} minorUnit
 * @param {string} currency
 * @returns {string}
 */
export function toDecimalUnit(minorUnit, currency = 'INR') {
  if (typeof minorUnit !== 'number' || !Number.isSafeInteger(minorUnit)) {
    return '0.00';
  }

  const currencyMeta = config.currencies[currency] || config.currencies.INR;
  const decimals = currencyMeta.decimals;

  if (decimals === 0) {
    return String(minorUnit);
  }

  const sign = minorUnit < 0 ? '-' : '';
  const abs = Math.abs(minorUnit);
  const factor = Math.pow(10, decimals);
  
  const whole = Math.floor(abs / factor);
  const remainder = abs % factor;
  const paddedRemainder = String(remainder).padStart(decimals, '0');

  return `${sign}${whole}.${paddedRemainder}`;
}

/**
 * Formats minor units for localized presentation.
 * E.g., 15075 paise with 'INR' -> '₹150.75'
 * @param {number} minorUnit
 * @param {string} currency
 * @param {string} locale
 * @returns {string}
 */
export function formatCurrency(minorUnit, currency = 'INR', locale = 'en-IN') {
  const decimalValue = parseFloat(toDecimalUnit(minorUnit, currency));
  const currencyMeta = config.currencies[currency] || config.currencies.INR;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currencyMeta.decimals,
      maximumFractionDigits: currencyMeta.decimals,
    }).format(decimalValue);
  } catch {
    return `${currencyMeta.symbol} ${decimalValue.toFixed(currencyMeta.decimals)}`;
  }
}

/**
 * Asserts that two operations do not mix currencies.
 * @param {string} c1
 * @param {string} c2
 */
export function assertSameCurrency(c1, c2, context = 'operation') {
  if (c1 !== c2) {
    throw new Error(`Currency mismatch in ${context}: cannot combine ${c1} and ${c2}`);
  }
}
