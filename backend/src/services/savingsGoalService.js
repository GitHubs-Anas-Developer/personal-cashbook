import { SavingsGoal } from '../models/SavingsGoal.js';
import { createTransaction } from './transactionService.js';
import { logAuditEvent } from './auditService.js';

export async function getUserSavingsGoals(userId) {
  const goals = await SavingsGoal.find({ userId })
    .populate('walletId', 'name type color icon currentBalanceMinor currency')
    .sort({ createdAt: -1 })
    .lean();

  return goals.map((goal) => {
    const percentage = Math.min(100, Math.round((goal.currentAmountMinor / goal.targetAmountMinor) * 100));
    return {
      ...goal,
      percentage,
      remainingAmountMinor: Math.max(0, goal.targetAmountMinor - goal.currentAmountMinor)
    };
  });
}

export async function createSavingsGoal(userId, goalData) {
  const goal = await SavingsGoal.create({
    ...goalData,
    userId,
    currentAmountMinor: goalData.currentAmountMinor || 0
  });

  await logAuditEvent({
    userId,
    action: 'create',
    entityType: 'savings_goal',
    entityId: goal._id,
    newState: goal.toObject()
  });

  return goal;
}

export async function updateSavingsGoal(userId, goalId, updateData) {
  const goal = await SavingsGoal.findOne({ _id: goalId, userId });
  if (!goal) {
    throw new Error('Savings goal not found or access denied');
  }

  const previousState = goal.toObject();
  Object.assign(goal, updateData);

  if (goal.currentAmountMinor >= goal.targetAmountMinor) {
    goal.status = 'completed';
  }

  await goal.save();

  await logAuditEvent({
    userId,
    action: 'update',
    entityType: 'savings_goal',
    entityId: goalId,
    previousState,
    newState: goal.toObject()
  });

  return goal;
}

export async function contributeToSavingsGoal(userId, goalId, { amountMinor, walletId }) {
  const goal = await SavingsGoal.findOne({ _id: goalId, userId });
  if (!goal) {
    throw new Error('Savings goal not found');
  }

  // If a source wallet is provided and goal has a linked savings wallet, execute transfer
  if (walletId && goal.walletId && String(walletId) !== String(goal.walletId)) {
    await createTransaction(userId, {
      type: 'transfer',
      amountMinor,
      currency: goal.currency,
      walletId,
      destinationWalletId: goal.walletId,
      description: `Contribution to savings goal: ${goal.name}`,
      linkedSavingsGoalId: goal._id
    });
  }

  goal.currentAmountMinor += amountMinor;
  if (goal.currentAmountMinor >= goal.targetAmountMinor) {
    goal.status = 'completed';
  }

  await goal.save();

  await logAuditEvent({
    userId,
    action: 'update',
    entityType: 'savings_goal',
    entityId: goalId,
    metadata: { contributionMinor: amountMinor }
  });

  return goal;
}

export async function deleteSavingsGoal(userId, goalId) {
  const goal = await SavingsGoal.findOneAndDelete({ _id: goalId, userId });
  if (!goal) {
    throw new Error('Savings goal not found');
  }
  return { success: true };
}
