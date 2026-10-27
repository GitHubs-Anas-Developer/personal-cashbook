import { Transaction } from '../models/Transaction.js';
import { ExportJob } from '../models/ExportJob.js';
import { getFinancialSummary } from '../services/reportService.js';
import { generateTransactionsCsv, generateSummaryCsv } from '../utils/csvGenerator.js';
import { generateFinancialPdf } from '../utils/pdfGenerator.js';
import { logAuditEvent } from '../services/auditService.js';

export async function exportFinancialData(req, res, next) {
  try {
    const { format = 'csv', type = 'transactions', startDate, endDate, walletId } = req.query;

    const query = { userId: req.userId, status: 'completed' };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (walletId) {
      query.$or = [{ walletId }, { destinationWalletId: walletId }];
    }

    const [transactions, summary] = await Promise.all([
      Transaction.find(query)
        .populate('walletId', 'name')
        .populate('destinationWalletId', 'name')
        .populate('categoryId', 'name')
        .sort({ date: -1 })
        .lean(),
      getFinancialSummary(req.userId, {
        period: 'custom',
        startDate,
        endDate,
        walletId
      })
    ]);

    // Record ExportJob for audit & tracking
    await ExportJob.create({
      userId: req.userId,
      format,
      exportType: type,
      status: 'completed',
      parameters: { startDate, endDate, walletId }
    });

    await logAuditEvent({
      userId: req.userId,
      action: 'export',
      entityType: 'transaction',
      entityId: req.userId,
      metadata: { format, type, count: transactions.length }
    });

    if (format === 'csv') {
      let csvContent = '';
      if (type === 'summary') {
        csvContent = generateSummaryCsv({
          ...summary,
          currency: req.user.preferences?.currency || 'INR'
        });
      } else {
        csvContent = generateTransactionsCsv(transactions);
      }

      const filename = `personal-cashbook-export-${Date.now()}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(csvContent);
    } else if (format === 'pdf') {
      const filename = `personal-cashbook-statement-${Date.now()}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      return generateFinancialPdf(
        {
          userName: req.user.name,
          period: `${summary.startDate.toLocaleDateString()} - ${summary.endDate.toLocaleDateString()}`,
          currency: req.user.preferences?.currency || 'INR',
          summary,
          transactions
        },
        res
      );
    } else {
      return res.status(400).json({ success: false, message: 'Unsupported export format' });
    }
  } catch (error) {
    next(error);
  }
}
