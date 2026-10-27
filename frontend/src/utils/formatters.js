export const CURRENCIES = {
  INR: { symbol: '₹', name: 'Indian Rupee', decimals: 2 },
  USD: { symbol: '$', name: 'US Dollar', decimals: 2 },
  EUR: { symbol: '€', name: 'Euro', decimals: 2 },
  GBP: { symbol: '£', name: 'British Pound', decimals: 2 },
  AED: { symbol: 'AED', name: 'UAE Dirham', decimals: 2 },
  SGD: { symbol: 'S$', name: 'Singapore Dollar', decimals: 2 },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', decimals: 2 },
  AUD: { symbol: 'A$', name: 'Australian Dollar', decimals: 2 },
  JPY: { symbol: '¥', name: 'Japanese Yen', decimals: 0 }
};

export function toDecimal(minorUnit = 0, currency = 'INR') {
  if (typeof minorUnit !== 'number' || isNaN(minorUnit)) return '0.00';
  const decimals = CURRENCIES[currency]?.decimals ?? 2;
  if (decimals === 0) return String(minorUnit);
  const factor = Math.pow(10, decimals);
  return (minorUnit / factor).toFixed(decimals);
}

export function toMinor(decimalString, currency = 'INR') {
  if (!decimalString && decimalString !== 0) return 0;
  const str = String(decimalString).trim();
  const decimals = CURRENCIES[currency]?.decimals ?? 2;
  const num = parseFloat(str);
  if (isNaN(num)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor);
}

export function formatMoney(minorUnit = 0, currency = 'INR') {
  if (typeof minorUnit !== 'number' || isNaN(minorUnit)) minorUnit = 0;
  const curr = CURRENCIES[currency] || CURRENCIES.INR;
  const decimal = minorUnit / Math.pow(10, curr.decimals);

  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: curr.decimals,
      maximumFractionDigits: curr.decimals
    }).format(decimal);
  } catch {
    return `${curr.symbol} ${decimal.toFixed(curr.decimals)}`;
  }
}

export function formatDate(dateInput, style = 'medium') {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  if (style === 'short') {
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  }
  if (style === 'time') {
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function getTransactionTypeColor(type) {
  switch (type) {
    case 'income':
      return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';
    case 'expense':
      return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800';
    case 'transfer':
      return 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800';
    case 'refund':
      return 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800';
    case 'reversal':
      return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
    default:
      return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
  }
}
