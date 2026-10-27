import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.js';
import { Wallet } from '../models/Wallet.js';
import { Category } from '../models/Category.js';
import { reconcileWalletBalance } from './walletService.js';
import { logAuditEvent } from './auditService.js';
import { idempotencyManager } from '../utils/idempotency.js';
import { checkBudgetAlertsForExpense } from './budgetService.js';
import { assertSameCurrency } from '../utils/money.js';

/**
 * Execute an operation inside a MongoDB session transaction if replica set is available,
 * otherwise execute gracefully in non-transactional atomic sequence.
 */
async function withOptionalTransaction(callback) {
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        // Ignored
      }
    }
    // If error is due to standalone MongoDB not supporting replica set transactions, fallback:
    if (
      error.message &&
      (error.message.includes('replica set') ||
        error.message.includes('Transaction numbers are only allowed') ||
        error.message.includes('Transactions are not supported'))
    ) {
      return await callback(null);
    }
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
}

/**
 * Creates a financial transaction with ownership validation, currency checks,
 * idempotency enforcement, and wallet balance updates.
 */
export async function createTransaction(userId, data) {
  const { idempotencyKey } = data;

  // 1. Idempotency Check
  if (idempotencyKey) {
    const cached = idempotencyManager.getCached(userId, idempotencyKey);
    if (cached) return cached;

    const acquired = idempotencyManager.acquire(userId, idempotencyKey);
    if (!acquired) {
      throw new Error('Transaction is currently being processed. Please wait.');
    }
  }

  try {
    const result = await withOptionalTransaction(async (session) => {
      // 2. Validate source wallet ownership
      const sourceWallet = await Wallet.findOne({ _id: data.walletId, userId }).session(session);
      if (!sourceWallet) {
        throw new Error('Source wallet not found or does not belong to you');
      }
      if (sourceWallet.isArchived) {
        throw new Error('Cannot post transactions to an archived wallet');
      }

      // Check currency alignment
      if (data.currency) {
        assertSameCurrency(data.currency, sourceWallet.currency, 'wallet');
      } else {
        data.currency = sourceWallet.currency;
      }

      // 3. For transfers, validate destination wallet
      let destWallet = null;
      if (data.type === 'transfer') {
        if (!data.destinationWalletId) {
          throw new Error('Destination wallet is required for transfer');
        }
        if (String(data.walletId) === String(data.destinationWalletId)) {
          throw new Error('Source and destination wallets must be different');
        }

        destWallet = await Wallet.findOne({ _id: data.destinationWalletId, userId }).session(session);
        if (!destWallet) {
          throw new Error('Destination wallet not found or does not belong to you');
        }
        if (destWallet.isArchived) {
          throw new Error('Cannot transfer to an archived wallet');
        }
        assertSameCurrency(sourceWallet.currency, destWallet.currency, 'transfer');
      }

      // 4. Validate category if provided
      if (data.categoryId) {
        const category = await Category.findOne({ _id: data.categoryId, userId }).session(session);
        if (!category) {
          throw new Error('Category not found or does not belong to you');
        }
        if (category.isArchived) {
          throw new Error('Cannot assign an archived category');
        }
      }

      // 5. Create transaction record
      const txDoc = {
        ...data,
        userId,
        status: 'completed'
      };
      if (!txDoc.idempotencyKey) {
        delete txDoc.idempotencyKey;
      }

      const [newTx] = await Transaction.create([txDoc], { session });

      // 6. Update cached balances & reconcile
      if (
        data.type === 'income' ||
        data.type === 'refund' ||
        (data.type === 'reversal' && data.reversalDirection === 'credit')
      ) {
        sourceWallet.currentBalanceMinor += data.amountMinor;
        await sourceWallet.save({ session });
      } else if (
        data.type === 'expense' ||
        (data.type === 'reversal' && data.reversalDirection === 'debit')
      ) {
        sourceWallet.currentBalanceMinor -= data.amountMinor;
        await sourceWallet.save({ session });
      } else if (data.type === 'transfer') {
        sourceWallet.currentBalanceMinor -= data.amountMinor;
        destWallet.currentBalanceMinor += data.amountMinor;
        await sourceWallet.save({ session });
        await destWallet.save({ session });
      }

      // 7. Audit log
      await logAuditEvent({
        userId,
        action: 'create',
        entityType: 'transaction',
        entityId: newTx._id,
        newState: newTx.toObject()
      });

      return newTx;
    });

    // Post-commit checks (e.g. budget alerts for expense)
    if (result.type === 'expense') {
      checkBudgetAlertsForExpense(userId, result).catch(() => {});
    }

    if (idempotencyKey) {
      idempotencyManager.resolve(userId, idempotencyKey, result);
    }

    return result;
  } catch (err) {
    if (idempotencyKey) {
      idempotencyManager.release(userId, idempotencyKey);
    }
    throw err;
  }
}

/**
 * Updates a transaction and reconciles affected wallet balances.
 */
export async function updateTransaction(userId, transactionId, updateData) {
  const existing = await Transaction.findOne({ _id: transactionId, userId });
  if (!existing) {
    throw new Error('Transaction not found or access denied');
  }

  const previousState = existing.toObject();
  const affectedWalletIds = new Set([String(existing.walletId)]);
  if (existing.destinationWalletId) {
    affectedWalletIds.add(String(existing.destinationWalletId));
  }
  if (updateData.walletId) {
    affectedWalletIds.add(String(updateData.walletId));
  }
  if (updateData.destinationWalletId) {
    affectedWalletIds.add(String(updateData.destinationWalletId));
  }

  Object.assign(existing, updateData);
  await existing.save();

  // Reconcile all affected wallets
  for (const wId of affectedWalletIds) {
    await reconcileWalletBalance(userId, wId);
  }

  await logAuditEvent({
    userId,
    action: 'update',
    entityType: 'transaction',
    entityId: transactionId,
    previousState,
    newState: existing.toObject()
  });

  return existing;
}

/**
 * Reverses a posted transaction instead of silently deleting it, preserving financial audit trail.
 */
export async function reverseTransaction(userId, transactionId, reason = 'User requested reversal') {
  const original = await Transaction.findOne({ _id: transactionId, userId });
  if (!original) {
    throw new Error('Transaction not found or access denied');
  }

  if (original.status === 'cancelled') {
    throw new Error('Transaction is already cancelled or reversed');
  }

  let reversalDirection = null;
  let reversalType = 'reversal';
  let reversalWalletId = original.walletId;
  let reversalDestId = original.destinationWalletId;

  if (original.type === 'expense') {
    // Reversing an expense CREDITS the wallet
    reversalDirection = 'credit';
  } else if (original.type === 'income') {
    // Reversing an income DEBITS the wallet
    reversalDirection = 'debit';
  } else if (original.type === 'transfer') {
    // Reversing a transfer: counter transfer swap
    reversalType = 'transfer';
    reversalWalletId = original.destinationWalletId;
    reversalDestId = original.walletId;
  }

  // Create reversing transaction
  const reversalTx = await createTransaction(userId, {
    type: reversalType,
    reversalDirection,
    amountMinor: original.amountMinor,
    currency: original.currency,
    walletId: reversalWalletId,
    destinationWalletId: reversalDestId,
    categoryId: original.categoryId,
    description: `[Reversal] ${original.description}`,
    notes: `Reversal of transaction ID: ${original._id}. Reason: ${reason}`,
    linkedTransactionId: original._id
  });

  await logAuditEvent({
    userId,
    action: 'reverse',
    entityType: 'transaction',
    entityId: original._id,
    previousState: original.toObject(),
    newState: { originalStatus: original.status, reversalId: reversalTx._id },
    metadata: { reason }
  });

  return { original, reversal: reversalTx };
}

/**
 * Deletes a transaction and reconciles wallet balances.
 */
export async function deleteTransaction(userId, transactionId) {
  const tx = await Transaction.findOne({ _id: transactionId, userId });
  if (!tx) {
    throw new Error('Transaction not found or access denied');
  }

  const previousState = tx.toObject();
  const affectedWalletIds = [tx.walletId];
  if (tx.destinationWalletId) {
    affectedWalletIds.push(tx.destinationWalletId);
  }

  await Transaction.deleteOne({ _id: transactionId, userId });

  for (const wId of affectedWalletIds) {
    await reconcileWalletBalance(userId, wId);
  }

  await logAuditEvent({
    userId,
    action: 'delete',
    entityType: 'transaction',
    entityId: transactionId,
    previousState
  });

  return { success: true };
}

/**
 * Searches and paginates transactions with filters.
 */
export async function getTransactions(userId, filters) {
  const {
    page = 1,
    limit = 20,
    search,
    type,
    walletId,
    categoryId,
    startDate,
    endDate,
    minAmountMinor,
    maxAmountMinor,
    tag,
    sortBy = 'date',
    sortOrder = 'desc'
  } = filters;

  const query = { userId };

  if (type && type !== 'all') {
    query.type = type;
  }

  if (walletId) {
    query.$or = [{ walletId }, { destinationWalletId: walletId }];
  }

  if (categoryId) {
    query.categoryId = categoryId;
  }

  if (tag) {
    query.tags = tag;
  }

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  if (minAmountMinor !== undefined || maxAmountMinor !== undefined) {
    query.amountMinor = {};
    if (minAmountMinor !== undefined) query.amountMinor.$gte = minAmountMinor;
    if (maxAmountMinor !== undefined) query.amountMinor.$lte = maxAmountMinor;
  }

  if (search) {
    query.$or = [
      { description: { $regex: search, $options: 'i' } },
      { notes: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [transactions, total] = await Promise.all([
    Transaction.find(query)
      .populate('walletId', 'name type color icon currency')
      .populate('destinationWalletId', 'name type color icon currency')
      .populate('categoryId', 'name type color icon')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Transaction.countDocuments(query)
  ]);

  return {
    transactions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getTransactionById(userId, transactionId) {
  const tx = await Transaction.findOne({ _id: transactionId, userId })
    .populate('walletId')
    .populate('destinationWalletId')
    .populate('categoryId')
    .populate('linkedTransactionId')
    .lean();

  if (!tx) {
    throw new Error('Transaction not found or access denied');
  }

  return tx;
}
