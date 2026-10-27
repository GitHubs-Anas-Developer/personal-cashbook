import { Debt } from '../models/Debt.js';
import { DebtPayment } from '../models/DebtPayment.js';
import { createTransaction } from './transactionService.js';
import { logAuditEvent } from './auditService.js';

export async function getUserDebts(userId, status = null) {
  const query = { userId };
  if (status) {
    query.status = status;
  }

  const debts = await Debt.find(query)
    .populate('walletId', 'name type color icon currency')
    .sort({ dueDate: 1, createdAt: -1 })
    .lean();

  return debts;
}

export async function getDebtById(userId, debtId) {
  const debt = await Debt.findOne({ _id: debtId, userId }).populate('walletId').lean();
  if (!debt) {
    throw new Error('Debt record not found');
  }

  const payments = await DebtPayment.find({ debtId, userId })
    .populate('walletId', 'name type')
    .sort({ date: -1 })
    .lean();

  return {
    ...debt,
    payments
  };
}

export async function createDebt(userId, debtData) {
  const debt = await Debt.create({
    ...debtData,
    userId,
    remainingAmountMinor: debtData.initialAmountMinor,
    status: 'active'
  });

  // Optional: If walletId is provided, post the initial disbursement transaction
  if (debtData.walletId) {
    const isLent = debt.type === 'lent';
    // If lent, money leaves wallet. If borrowed, money enters wallet.
    await createTransaction(userId, {
      type: isLent ? 'expense' : 'income',
      amountMinor: debt.initialAmountMinor,
      currency: debt.currency,
      walletId: debtData.walletId,
      description: isLent ? `Money lent to ${debt.personName}` : `Money borrowed from ${debt.personName}`,
      notes: `Debt disbursement ID: ${debt._id}`,
      linkedDebtId: debt._id
    });
  }

  await logAuditEvent({
    userId,
    action: 'create',
    entityType: 'debt',
    entityId: debt._id,
    newState: debt.toObject()
  });

  return debt;
}

export async function updateDebt(userId, debtId, updateData) {
  const debt = await Debt.findOneAndUpdate(
    { _id: debtId, userId },
    { $set: updateData },
    { new: true }
  );

  if (!debt) {
    throw new Error('Debt record not found');
  }

  return debt;
}

export async function recordDebtPayment(userId, debtId, paymentData) {
  const debt = await Debt.findOne({ _id: debtId, userId });
  if (!debt) {
    throw new Error('Debt record not found');
  }

  if (debt.status === 'settled') {
    throw new Error('This debt has already been fully settled');
  }

  if (paymentData.amountMinor > debt.remainingAmountMinor) {
    throw new Error(
      `Payment amount cannot exceed remaining balance of ${debt.remainingAmountMinor} minor units`
    );
  }

  // Record ledger transaction for repayment:
  // If we lent money: repayment comes IN to wallet (income/refund)
  // If we borrowed money: repayment goes OUT of wallet (expense)
  const isLent = debt.type === 'lent';
  const tx = await createTransaction(userId, {
    type: isLent ? 'income' : 'expense',
    amountMinor: paymentData.amountMinor,
    currency: debt.currency,
    walletId: paymentData.walletId,
    description: isLent
      ? `Debt repayment received from ${debt.personName}`
      : `Debt repayment made to ${debt.personName}`,
    notes: paymentData.notes || `Repayment for debt ID: ${debt._id}`,
    linkedDebtId: debt._id
  });

  const payment = await DebtPayment.create({
    userId,
    debtId: debt._id,
    amountMinor: paymentData.amountMinor,
    currency: debt.currency,
    date: paymentData.date || new Date(),
    walletId: paymentData.walletId,
    transactionId: tx._id,
    notes: paymentData.notes || ''
  });

  // Update remaining debt balance
  debt.remainingAmountMinor -= paymentData.amountMinor;
  if (debt.remainingAmountMinor === 0) {
    debt.status = 'settled';
  }
  await debt.save();

  await logAuditEvent({
    userId,
    action: 'create',
    entityType: 'debt',
    entityId: debt._id,
    metadata: {
      paymentId: payment._id,
      amountMinor: paymentData.amountMinor,
      remainingAmountMinor: debt.remainingAmountMinor
    }
  });

  return { payment, debt };
}

export async function deleteDebt(userId, debtId) {
  const debt = await Debt.findOneAndDelete({ _id: debtId, userId });
  if (!debt) {
    throw new Error('Debt record not found');
  }
  await DebtPayment.deleteMany({ debtId, userId });
  return { success: true };
}
