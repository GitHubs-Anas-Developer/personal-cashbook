import * as reportService from '../services/reportService.js';
import { Transaction } from '../models/Transaction.js';
import { Budget } from '../models/Budget.js';
import { RecurringRule } from '../models/RecurringRule.js';
import { getUserBudgetsWithProgress } from '../services/budgetService.js';

export async function getDashboardOverview(req, res, next) {
  try {
    const period = req.query.period || 'monthly';
    const summary = await reportService.getFinancialSummary(req.userId, { period });
    const cashFlowHistory = await reportService.getMonthlyCashFlow(req.userId, 6);

    // Recent 5 transactions
    const recentTransactions = await Transaction.find({ userId: req.userId })
      .populate('walletId', 'name type color icon currency')
      .populate('destinationWalletId', 'name type color icon currency')
      .populate('categoryId', 'name type color icon')
      .sort({ date: -1 })
      .limit(5)
      .lean();

    // Budget progress
    const budgets = await getUserBudgetsWithProgress(req.userId);

    // Upcoming payments (recurring rules or debt due dates)
    const upcomingPayments = await RecurringRule.find({
      userId: req.userId,
      status: 'active',
      nextRunDate: { $gte: new Date() }
    })
      .populate('walletId', 'name type')
      .populate('categoryId', 'name color icon')
      .sort({ nextRunDate: 1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      data: {
        summary,
        cashFlowHistory,
        recentTransactions,
        budgets: budgets.slice(0, 4),
        upcomingPayments
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getReportSummary(req, res, next) {
  try {
    const { period, startDate, endDate, walletId } = req.query;
    const summary = await reportService.getFinancialSummary(req.userId, {
      period,
      startDate,
      endDate,
      walletId
    });

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
}

export async function getCashFlowChartData(req, res, next) {
  try {
    const months = parseInt(req.query.months || '6', 10);
    const chartData = await reportService.getMonthlyCashFlow(req.userId, months);
    res.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    next(error);
  }
}
