import { RecurringRule } from '../models/RecurringRule.js';
import { createTransaction } from './transactionService.js';
import { createNotification } from './notificationService.js';

export function calculateNextRunDate(currentDate, frequency) {
  const next = new Date(currentDate);
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
  }
  return next;
}

export async function getUserRecurringRules(userId) {
  return await RecurringRule.find({ userId })
    .populate('walletId', 'name type color icon currency')
    .populate('destinationWalletId', 'name type color icon currency')
    .populate('categoryId', 'name type color icon')
    .sort({ nextRunDate: 1 })
    .lean();
}

export async function createRecurringRule(userId, ruleData) {
  const startDate = ruleData.startDate ? new Date(ruleData.startDate) : new Date();
  const nextRunDate = calculateNextRunDate(startDate, ruleData.frequency);

  const rule = await RecurringRule.create({
    ...ruleData,
    userId,
    startDate,
    nextRunDate
  });

  return rule;
}

export async function updateRecurringRule(userId, ruleId, updateData) {
  const rule = await RecurringRule.findOneAndUpdate(
    { _id: ruleId, userId },
    { $set: updateData },
    { new: true }
  );
  if (!rule) {
    throw new Error('Recurring rule not found');
  }
  return rule;
}

export async function processDueRecurringRule(userId, ruleId) {
  const rule = await RecurringRule.findOne({ _id: ruleId, userId });
  if (!rule) {
    throw new Error('Recurring rule not found');
  }

  // Create corresponding transaction
  const tx = await createTransaction(userId, {
    type: rule.type,
    amountMinor: rule.amountMinor,
    currency: rule.currency,
    walletId: rule.walletId,
    destinationWalletId: rule.destinationWalletId,
    categoryId: rule.categoryId,
    description: `[Recurring] ${rule.title}`,
    notes: rule.description,
    isRecurringInstance: true,
    recurringRuleId: rule._id
  });

  rule.lastRunDate = new Date();
  rule.nextRunDate = calculateNextRunDate(rule.nextRunDate, rule.frequency);

  // If endDate passed, mark completed
  if (rule.endDate && rule.nextRunDate > rule.endDate) {
    rule.status = 'completed';
  }

  await rule.save();

  await createNotification({
    userId,
    type: 'recurring_reminder',
    title: `Recurring Processed: ${rule.title}`,
    message: `A scheduled ${rule.type} of ${rule.title} was processed.`,
    severity: 'success',
    data: { ruleId: rule._id, transactionId: tx._id }
  });

  return { rule, transaction: tx };
}

export async function deleteRecurringRule(userId, ruleId) {
  const rule = await RecurringRule.findOneAndDelete({ _id: ruleId, userId });
  if (!rule) {
    throw new Error('Recurring rule not found');
  }
  return { success: true };
}
