import { Wallet } from '../models/Wallet.js';
import { Transaction } from '../models/Transaction.js';
import { DEFAULT_WALLETS } from '../data/defaultCategories.js';
import { logAuditEvent } from './auditService.js';

export async function seedDefaultWalletsForUser(userId, currency = 'INR') {
  const existing = await Wallet.countDocuments({ userId });
  if (existing > 0) return;

  const walletsToInsert = DEFAULT_WALLETS.map((w, index) => ({
    ...w,
    userId,
    currency,
    sortOrder: index,
    currentBalanceMinor: w.openingBalanceMinor
  }));

  await Wallet.insertMany(walletsToInsert);
}

/**
 * Reconciles the authoritative current balance of a specific wallet based on ledger entries.
 * Balance = openingBalance
 *   + income (where walletId == wallet)
 *   - expense (where walletId == wallet)
 *   + refund (where walletId == wallet)
 *   + reversal (credit)
 *   - reversal (debit)
 *   - transfer OUT (where walletId == wallet)
 *   + transfer IN (where destinationWalletId == wallet)
 */
export async function reconcileWalletBalance(userId, walletId, session = null) {
  const wallet = await Wallet.findOne({ _id: walletId, userId }).session(session);
  if (!wallet) {
    throw new Error('Wallet not found');
  }

  // 1. Transactions where wallet is primary (walletId)
  const outgoingOrDirectTxs = await Transaction.find({
    userId,
    walletId,
    status: 'completed'
  }).session(session).lean();

  // 2. Transactions where wallet is destination (transfers in)
  const incomingTransfers = await Transaction.find({
    userId,
    destinationWalletId: walletId,
    type: 'transfer',
    status: 'completed'
  }).session(session).lean();

  let computedBalance = wallet.openingBalanceMinor;

  for (const tx of outgoingOrDirectTxs) {
    switch (tx.type) {
      case 'income':
        computedBalance += tx.amountMinor;
        break;
      case 'expense':
        computedBalance -= tx.amountMinor;
        break;
      case 'transfer':
        computedBalance -= tx.amountMinor;
        break;
      case 'refund':
        computedBalance += tx.amountMinor;
        break;
      case 'reversal':
        if (tx.reversalDirection === 'credit') {
          computedBalance += tx.amountMinor;
        } else if (tx.reversalDirection === 'debit') {
          computedBalance -= tx.amountMinor;
        }
        break;
      default:
        break;
    }
  }

  for (const tx of incomingTransfers) {
    computedBalance += tx.amountMinor;
  }

  wallet.currentBalanceMinor = computedBalance;
  await wallet.save({ session });

  return computedBalance;
}

export async function getUserWallets(userId, includeArchived = false) {
  const query = { userId };
  if (!includeArchived) {
    query.isArchived = false;
  }
  return await Wallet.find(query).sort({ isDefault: -1, sortOrder: 1, createdAt: 1 }).lean();
}

export async function getWalletById(userId, walletId) {
  const wallet = await Wallet.findOne({ _id: walletId, userId });
  if (!wallet) {
    throw new Error('Wallet not found or access denied');
  }
  return wallet;
}

export async function createWallet(userId, walletData) {
  if (walletData.isDefault) {
    await Wallet.updateMany({ userId }, { isDefault: false });
  }

  const wallet = await Wallet.create({
    ...walletData,
    userId,
    currentBalanceMinor: walletData.openingBalanceMinor || 0
  });

  await logAuditEvent({
    userId,
    action: 'create',
    entityType: 'wallet',
    entityId: wallet._id,
    newState: wallet.toObject()
  });

  return wallet;
}

export async function updateWallet(userId, walletId, updateData) {
  const existing = await Wallet.findOne({ _id: walletId, userId });
  if (!existing) {
    throw new Error('Wallet not found or access denied');
  }

  const previousState = existing.toObject();

  if (updateData.isDefault) {
    await Wallet.updateMany({ userId, _id: { $ne: walletId } }, { isDefault: false });
  }

  const openingBalanceChanged =
    updateData.openingBalanceMinor !== undefined &&
    updateData.openingBalanceMinor !== existing.openingBalanceMinor;

  Object.assign(existing, updateData);
  await existing.save();

  if (openingBalanceChanged) {
    await reconcileWalletBalance(userId, walletId);
  }

  await logAuditEvent({
    userId,
    action: 'update',
    entityType: 'wallet',
    entityId: walletId,
    previousState,
    newState: existing.toObject()
  });

  return existing;
}

export async function archiveWallet(userId, walletId) {
  const wallet = await Wallet.findOne({ _id: walletId, userId });
  if (!wallet) {
    throw new Error('Wallet not found or access denied');
  }

  if (wallet.isDefault) {
    throw new Error('Cannot archive the default wallet. Set another wallet as default first.');
  }

  const previousState = wallet.toObject();
  wallet.isArchived = true;
  await wallet.save();

  await logAuditEvent({
    userId,
    action: 'update',
    entityType: 'wallet',
    entityId: walletId,
    previousState,
    newState: wallet.toObject(),
    metadata: { reason: 'Wallet archived' }
  });

  return wallet;
}

export async function unarchiveWallet(userId, walletId) {
  const wallet = await Wallet.findOne({ _id: walletId, userId });
  if (!wallet) {
    throw new Error('Wallet not found or access denied');
  }

  wallet.isArchived = false;
  await wallet.save();
  return wallet;
}
