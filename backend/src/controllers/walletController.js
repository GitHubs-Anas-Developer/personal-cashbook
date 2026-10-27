import * as walletService from '../services/walletService.js';

export async function listWallets(req, res, next) {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const wallets = await walletService.getUserWallets(req.userId, includeArchived);
    res.json({
      success: true,
      data: wallets
    });
  } catch (error) {
    next(error);
  }
}

export async function getWallet(req, res, next) {
  try {
    const wallet = await walletService.getWalletById(req.userId, req.params.id);
    res.json({
      success: true,
      data: wallet
    });
  } catch (error) {
    next(error);
  }
}

export async function createWallet(req, res, next) {
  try {
    const wallet = await walletService.createWallet(req.userId, req.body);
    res.status(201).json({
      success: true,
      message: 'Wallet created successfully',
      data: wallet
    });
  } catch (error) {
    next(error);
  }
}

export async function updateWallet(req, res, next) {
  try {
    const wallet = await walletService.updateWallet(req.userId, req.params.id, req.body);
    res.json({
      success: true,
      message: 'Wallet updated successfully',
      data: wallet
    });
  } catch (error) {
    next(error);
  }
}

export async function archiveWallet(req, res, next) {
  try {
    const wallet = await walletService.archiveWallet(req.userId, req.params.id);
    res.json({
      success: true,
      message: 'Wallet archived successfully',
      data: wallet
    });
  } catch (error) {
    next(error);
  }
}

export async function unarchiveWallet(req, res, next) {
  try {
    const wallet = await walletService.unarchiveWallet(req.userId, req.params.id);
    res.json({
      success: true,
      message: 'Wallet restored successfully',
      data: wallet
    });
  } catch (error) {
    next(error);
  }
}

export async function reconcileWallet(req, res, next) {
  try {
    const balance = await walletService.reconcileWalletBalance(req.userId, req.params.id);
    res.json({
      success: true,
      message: 'Wallet reconciled successfully with ledger',
      data: { currentBalanceMinor: balance }
    });
  } catch (error) {
    next(error);
  }
}
