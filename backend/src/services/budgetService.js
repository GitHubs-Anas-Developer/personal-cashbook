import { Budget } from '../models/Budget.js';
import { Transaction } from '../models/Transaction.js';
import { createNotification } from './notificationService.js';
import { formatCurrency } from '../utils/money.js';

/**
 * Calculates current spend for a budget period.
 * Strict financial rule: Budget calculations EXCLUDE transfers and non-expense entries!
 */
export async function calculateBudgetSpend(userId, budget) {
  const now = new Date();
  let periodStart = new Date(budget.startDate);
  let periodEnd = budget.endDate ? new Date(budget.endDate) : new Date();

  // If ongoing monthly/weekly/yearly recurring budget:
  if (!budget.endDate) {
    if (budget.period === 'monthly') {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (budget.period === 'weekly') {
      const day = now.getDay();
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - day);
      periodStart.setHours(0, 0, 0, 0);

      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodStart.getDate() + 6);
      periodEnd.setHours(23, 59, 59, 999);
    } else if (budget.period === 'yearly') {
      periodStart = new Date(now.getFullYear(), 0, 1);
      periodEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }
  }

  const query = {
    userId,
    type: 'expense',
    status: 'completed',
    date: { $gte: periodStart, $lte: periodEnd }
  };

  if (budget.categoryId) {
    query.categoryId = budget.categoryId;
  }

  // Aggregate total expenses
  const result = await Transaction.aggregate([
    { $match: query },
    { $group: { _id: null, totalSpentMinor: { $sum: '$amountMinor' } } }
  ]);

  const spentMinor = result.length > 0 ? result[0].totalSpentMinor : 0;
  const percentage = Math.round((spentMinor / budget.amountMinor) * 100);
  const remainingMinor = budget.amountMinor - spentMinor;

  return {
    spentMinor,
    percentage,
    remainingMinor,
    isExceeded: spentMinor > budget.amountMinor,
    periodStart,
    periodEnd
  };
}

/**
 * Checks if a newly added expense breaches budget alert thresholds
 */
export async function checkBudgetAlertsForExpense(userId, transaction) {
  if (transaction.type !== 'expense') return;

  const activeBudgets = await Budget.find({
    userId,
    isActive: true,
    $or: [{ categoryId: transaction.categoryId }, { categoryId: null }]
  });

  for (const budget of activeBudgets) {
    const stats = await calculateBudgetSpend(userId, budget);

    if (stats.percentage >= 100) {
      await createNotification({
        userId,
        type: 'budget_alert',
        title: `Budget Exceeded: ${budget.name}`,
        message: `You have spent ${formatCurrency(stats.spentMinor, budget.currency)} (${stats.percentage}%) of your ${formatCurrency(budget.amountMinor, budget.currency)} budget.`,
        severity: 'error',
        data: { budgetId: budget._id, spentMinor: stats.spentMinor, amountMinor: budget.amountMinor }
      });
    } else if (stats.percentage >= budget.alertThresholdPercent) {
      await createNotification({
        userId,
        type: 'budget_alert',
        title: `Budget Alert: ${budget.name} (${stats.percentage}%)`,
        message: `You have reached ${stats.percentage}% of your ${budget.name} budget limit.`,
        severity: 'warning',
        data: { budgetId: budget._id, spentMinor: stats.spentMinor, amountMinor: budget.amountMinor }
      });
    }
  }
}

export async function getUserBudgetsWithProgress(userId) {
  const budgets = await Budget.find({ userId, isActive: true })
    .populate('categoryId', 'name color icon')
    .lean();

  const budgetsWithProgress = await Promise.all(
    budgets.map(async (budget) => {
      const stats = await calculateBudgetSpend(userId, budget);
      return {
        ...budget,
        ...stats
      };
    })
  );

  return budgetsWithProgress;
}

export async function createBudget(userId, budgetData) {
  return await Budget.create({ ...budgetData, userId });
}

export async function updateBudget(userId, budgetId, updateData) {
  const budget = await Budget.findOneAndUpdate(
    { _id: budgetId, userId },
    { $set: updateData },
    { new: true }
  );
  if (!budget) {
    throw new Error('Budget not found or access denied');
  }
  return budget;
}

export async function deleteBudget(userId, budgetId) {
  const budget = await Budget.findOneAndDelete({ _id: budgetId, userId });
  if (!budget) {
    throw new Error('Budget not found or access denied');
  }
  return { success: true };
}
