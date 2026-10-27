import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.js';
import { Wallet } from '../models/Wallet.js';
import { Category } from '../models/Category.js';

/**
 * Resolves start and end Date for a named period.
 */
export function resolvePeriodDateRange(period, customStart, customEnd) {
  const now = new Date();
  let startDate;
  let endDate = new Date(now);

  switch (period) {
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    case 'weekly':
      const day = now.getDay();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - day);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    case 'custom':
      startDate = customStart ? new Date(customStart) : new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = customEnd ? new Date(customEnd) : new Date();
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  return { startDate, endDate };
}

/**
 * Computes consolidated financial report.
 * Guaranteed:
 * - Transfers are NOT counted as income or expenses.
 * - Opening balance is NOT counted as income.
 * - Net cash flow = income - expense.
 */
export async function getFinancialSummary(userId, { period = 'monthly', startDate: cStart, endDate: cEnd, walletId = null }) {
  const { startDate, endDate } = resolvePeriodDateRange(period, cStart, cEnd);

  const baseMatch = {
    userId: new mongoose.Types.ObjectId(userId),
    status: 'completed',
    date: { $gte: startDate, $lte: endDate }
  };

  if (walletId) {
    baseMatch.$or = [
      { walletId: new mongoose.Types.ObjectId(walletId) },
      { destinationWalletId: new mongoose.Types.ObjectId(walletId) }
    ];
  }

  // 1. Consolidated totals
  const totalsAgg = await Transaction.aggregate([
    { $match: baseMatch },
    {
      $group: {
        _id: '$type',
        totalMinor: { $sum: '$amountMinor' },
        count: { $sum: 1 }
      }
    }
  ]);

  let totalIncomeMinor = 0;
  let totalExpenseMinor = 0;
  let totalRefundMinor = 0;

  for (const item of totalsAgg) {
    if (item._id === 'income') totalIncomeMinor = item.totalMinor;
    if (item._id === 'expense') totalExpenseMinor = item.totalMinor;
    if (item._id === 'refund') totalRefundMinor = item.totalMinor;
  }

  // Net Cash Flow = Total Income + Refunds - Total Expenses
  const netCashFlowMinor = totalIncomeMinor + totalRefundMinor - totalExpenseMinor;

  // 2. Total active wallet balance (snapshot of actual funds)
  const wallets = await Wallet.find({ userId, isArchived: false }).lean();
  const totalWalletBalanceMinor = wallets.reduce((acc, w) => acc + (w.currentBalanceMinor || 0), 0);

  // 3. Category spending breakdown (only expenses)
  const categoryMatch = {
    userId: new mongoose.Types.ObjectId(userId),
    type: 'expense',
    status: 'completed',
    date: { $gte: startDate, $lte: endDate }
  };
  if (walletId) {
    categoryMatch.walletId = new mongoose.Types.ObjectId(walletId);
  }

  const categoryAgg = await Transaction.aggregate([
    { $match: categoryMatch },
    {
      $group: {
        _id: '$categoryId',
        totalMinor: { $sum: '$amountMinor' },
        txCount: { $sum: 1 }
      }
    },
    { $sort: { totalMinor: -1 } }
  ]);

  // Populate category info
  const categoryIds = categoryAgg.map((c) => c._id).filter(Boolean);
  const categories = await Category.find({ _id: { $in: categoryIds } }).lean();
  const categoryMap = new Map(categories.map((c) => [String(c._id), c]));

  const categoryBreakdown = categoryAgg.map((item) => {
    const cat = item._id ? categoryMap.get(String(item._id)) : null;
    const percentage = totalExpenseMinor > 0 ? Math.round((item.totalMinor / totalExpenseMinor) * 100) : 0;
    return {
      categoryId: item._id,
      categoryName: cat ? cat.name : 'Uncategorized',
      color: cat ? cat.color : '#94A3B8',
      icon: cat ? cat.icon : 'tag',
      type: 'expense',
      amountMinor: item.totalMinor,
      percentage,
      txCount: item.txCount
    };
  });

  return {
    period,
    startDate,
    endDate,
    totalIncomeMinor,
    totalExpenseMinor,
    totalRefundMinor,
    netCashFlowMinor,
    totalWalletBalanceMinor,
    categoryBreakdown,
    walletsCount: wallets.length
  };
}

/**
 * Computes monthly cash flow data for historical charts (last 6 to 12 months).
 */
export async function getMonthlyCashFlow(userId, monthsCount = 6) {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - monthsCount + 1, 1);

  const monthlyAgg = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        status: 'completed',
        date: { $gte: startDate },
        type: { $in: ['income', 'expense'] }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          type: '$type'
        },
        totalMinor: { $sum: '$amountMinor' }
      }
    }
  ]);

  const map = new Map();

  // Initialize all months
  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const key = `${year}-${String(month).padStart(2, '0')}`;
    const monthName = d.toLocaleString('en-US', { month: 'short' });

    map.set(key, {
      monthKey: key,
      monthName: `${monthName} ${year}`,
      incomeMinor: 0,
      expenseMinor: 0,
      netCashFlowMinor: 0
    });
  }

  // Fill aggregated values
  for (const item of monthlyAgg) {
    const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
    if (map.has(key)) {
      const entry = map.get(key);
      if (item._id.type === 'income') entry.incomeMinor = item.totalMinor;
      if (item._id.type === 'expense') entry.expenseMinor = item.totalMinor;
      entry.netCashFlowMinor = entry.incomeMinor - entry.expenseMinor;
    }
  }

  return Array.from(map.values());
}
