import { toDecimalUnit } from './money.js';

/**
 * Escapes a field for CSV according to RFC 4180
 */
function escapeCsv(value) {
  if (value === null || value === undefined) return '""';
  const stringVal = String(value).replace(/"/g, '""');
  return `"${stringVal}"`;
}

/**
 * Generates CSV string for transactions
 * @param {Array} transactions
 * @returns {string}
 */
export function generateTransactionsCsv(transactions) {
  const headers = [
    'Date',
    'Type',
    'Category',
    'Wallet',
    'Destination Wallet',
    'Amount',
    'Currency',
    'Description',
    'Tags',
    'Status',
    'Notes'
  ];

  const rows = transactions.map((tx) => {
    const formattedDate = new Date(tx.date).toISOString().split('T')[0];
    const categoryName = tx.categoryId ? tx.categoryId.name : '';
    const walletName = tx.walletId ? tx.walletId.name : '';
    const destWalletName = tx.destinationWalletId ? tx.destinationWalletId.name : '';
    const decimalAmount = toDecimalUnit(tx.amountMinor, tx.currency);
    const tagsStr = (tx.tags || []).join('; ');

    return [
      escapeCsv(formattedDate),
      escapeCsv(tx.type.toUpperCase()),
      escapeCsv(categoryName),
      escapeCsv(walletName),
      escapeCsv(destWalletName),
      escapeCsv(decimalAmount),
      escapeCsv(tx.currency),
      escapeCsv(tx.description),
      escapeCsv(tagsStr),
      escapeCsv(tx.status),
      escapeCsv(tx.notes || '')
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Generates CSV for financial summary report
 */
export function generateSummaryCsv(summaryData) {
  const lines = [
    'PERSONAL CASHBOOK FINANCIAL REPORT',
    `Generated On,${new Date().toISOString()}`,
    `Reporting Period,${summaryData.period}`,
    `Currency,${summaryData.currency}`,
    '',
    'METRICS,AMOUNT',
    `Total Income,${toDecimalUnit(summaryData.totalIncomeMinor, summaryData.currency)}`,
    `Total Expenses,${toDecimalUnit(summaryData.totalExpenseMinor, summaryData.currency)}`,
    `Net Cash Flow,${toDecimalUnit(summaryData.netCashFlowMinor, summaryData.currency)}`,
    `Total Wallet Balance,${toDecimalUnit(summaryData.totalWalletBalanceMinor, summaryData.currency)}`,
    '',
    'CATEGORY BREAKDOWN',
    'Category,Type,Amount,Percentage'
  ];

  if (summaryData.categoryBreakdown && summaryData.categoryBreakdown.length > 0) {
    summaryData.categoryBreakdown.forEach((item) => {
      const dec = toDecimalUnit(item.amountMinor, summaryData.currency);
      lines.push(`${escapeCsv(item.categoryName)},${item.type},${dec},${item.percentage}%`);
    });
  }

  return lines.join('\r\n');
}
