import PDFDocument from 'pdfkit';
import { toDecimalUnit, formatCurrency } from './money.js';

/**
 * Builds a streamable PDF report for transactions and financial summary.
 * @param {Object} options
 * @param {string} options.userName
 * @param {string} options.period
 * @param {string} options.currency
 * @param {Object} options.summary
 * @param {Array} options.transactions
 * @param {NodeJS.WritableStream} res - Express response stream
 */
export function generateFinancialPdf({ userName, period, currency, summary, transactions }, res) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(res);

  const primaryIndigo = '#4338CA';
  const textDark = '#1E293B';
  const textMuted = '#64748B';
  const green = '#059669';
  const red = '#DC2626';

  // Header
  doc.fillColor(primaryIndigo).fontSize(20).font('Helvetica-Bold').text('PERSONAL CASHBOOK', 40, 40);
  doc.fillColor(textMuted).fontSize(9).font('Helvetica').text('CONFIDENTIAL FINANCIAL STATEMENT', 40, 65);

  doc.fillColor(textDark).fontSize(9).font('Helvetica-Bold').text(`Account: ${userName}`, 350, 40, { align: 'right' });
  doc.fillColor(textMuted).font('Helvetica').text(`Statement Period: ${period}`, 350, 54, { align: 'right' });
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 350, 68, { align: 'right' });

  // Divider
  doc.moveTo(40, 85).lineTo(555, 85).strokeColor('#E2E8F0').lineWidth(1).stroke();

  // Summary Metrics Banner
  let y = 100;
  doc.rect(40, y, 515, 65).fill('#F8FAFC').stroke('#E2E8F0');

  // Income box
  doc.fillColor(textMuted).fontSize(8).font('Helvetica').text('TOTAL INCOME', 55, y + 12);
  doc.fillColor(green).fontSize(13).font('Helvetica-Bold').text(formatCurrency(summary.totalIncomeMinor, currency), 55, y + 26);

  // Expense box
  doc.fillColor(textMuted).fontSize(8).font('Helvetica').text('TOTAL EXPENSES', 185, y + 12);
  doc.fillColor(red).fontSize(13).font('Helvetica-Bold').text(formatCurrency(summary.totalExpenseMinor, currency), 185, y + 26);

  // Net Cash Flow box
  const netColor = summary.netCashFlowMinor >= 0 ? green : red;
  doc.fillColor(textMuted).fontSize(8).font('Helvetica').text('NET CASH FLOW', 315, y + 12);
  doc.fillColor(netColor).fontSize(13).font('Helvetica-Bold').text(formatCurrency(summary.netCashFlowMinor, currency), 315, y + 26);

  // Wallet Balance box
  doc.fillColor(textMuted).fontSize(8).font('Helvetica').text('WALLET BALANCES', 440, y + 12);
  doc.fillColor(primaryIndigo).fontSize(13).font('Helvetica-Bold').text(formatCurrency(summary.totalWalletBalanceMinor, currency), 440, y + 26);

  y += 85;

  // Transactions Section Header
  doc.fillColor(textDark).fontSize(13).font('Helvetica-Bold').text('Transaction Ledger', 40, y);
  y += 18;

  // Table Header
  doc.rect(40, y, 515, 20).fill('#4338CA');
  doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
  doc.text('Date', 45, y + 6, { width: 65 });
  doc.text('Type', 115, y + 6, { width: 55 });
  doc.text('Category / Wallet', 175, y + 6, { width: 130 });
  doc.text('Description', 310, y + 6, { width: 140 });
  doc.text('Amount', 455, y + 6, { width: 95, align: 'right' });

  y += 20;

  // Table Rows
  const maxRows = 45;
  const displayTxs = transactions.slice(0, maxRows);

  displayTxs.forEach((tx, idx) => {
    // Pagination check
    if (y > 750) {
      doc.addPage();
      y = 40;
      // Repeat header
      doc.rect(40, y, 515, 20).fill('#4338CA');
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      doc.text('Date', 45, y + 6, { width: 65 });
      doc.text('Type', 115, y + 6, { width: 55 });
      doc.text('Category / Wallet', 175, y + 6, { width: 130 });
      doc.text('Description', 310, y + 6, { width: 140 });
      doc.text('Amount', 455, y + 6, { width: 95, align: 'right' });
      y += 20;
    }

    const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
    doc.rect(40, y, 515, 18).fill(rowBg);

    const formattedDate = new Date(tx.date).toLocaleDateString();
    const typeLabel = tx.type.toUpperCase();
    const categoryWallet = `${tx.categoryId?.name || 'Transfer'} (${tx.walletId?.name || 'Wallet'})`;
    const desc = tx.description.length > 28 ? tx.description.substring(0, 26) + '...' : tx.description;
    const formattedAmount = formatCurrency(tx.amountMinor, tx.currency);

    let amountColor = textDark;
    if (tx.type === 'income') amountColor = green;
    if (tx.type === 'expense') amountColor = red;

    doc.fillColor(textDark).fontSize(7.5).font('Helvetica');
    doc.text(formattedDate, 45, y + 5, { width: 65 });
    doc.text(typeLabel, 115, y + 5, { width: 55 });
    doc.text(categoryWallet, 175, y + 5, { width: 130 });
    doc.text(desc, 310, y + 5, { width: 140 });

    doc.fillColor(amountColor).font('Helvetica-Bold');
    doc.text(formattedAmount, 455, y + 5, { width: 95, align: 'right' });

    y += 18;
  });

  // Footer
  const footerY = 800;
  doc.fontSize(7).fillColor(textMuted).font('Helvetica');
  doc.text('Personal Cashbook — Strictly Private & Confidential Financial Report', 40, footerY, { align: 'center', width: 515 });

  doc.end();
}
