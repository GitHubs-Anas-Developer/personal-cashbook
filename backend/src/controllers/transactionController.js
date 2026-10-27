import * as transactionService from '../services/transactionService.js';

export async function listTransactions(req, res, next) {
  try {
    const result = await transactionService.getTransactions(req.userId, req.query);
    res.json({
      success: true,
      data: result.transactions,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
}

export async function getTransaction(req, res, next) {
  try {
    const transaction = await transactionService.getTransactionById(req.userId, req.params.id);
    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
}

export async function createTransaction(req, res, next) {
  try {
    const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey;
    const transaction = await transactionService.createTransaction(req.userId, {
      ...req.body,
      idempotencyKey
    });

    res.status(201).json({
      success: true,
      message: 'Transaction recorded successfully',
      data: transaction
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTransaction(req, res, next) {
  try {
    const transaction = await transactionService.updateTransaction(req.userId, req.params.id, req.body);
    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction
    });
  } catch (error) {
    next(error);
  }
}

export async function reverseTransaction(req, res, next) {
  try {
    const { reason } = req.body;
    const result = await transactionService.reverseTransaction(req.userId, req.params.id, reason);
    res.json({
      success: true,
      message: 'Transaction reversed and audited successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTransaction(req, res, next) {
  try {
    const result = await transactionService.deleteTransaction(req.userId, req.params.id);
    res.json({
      success: true,
      message: 'Transaction deleted successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function uploadReceipt(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No receipt file uploaded'
      });
    }

    const receiptData = {
      url: `/uploads/${req.file.filename}`,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size
    };

    res.json({
      success: true,
      message: 'Receipt uploaded safely',
      data: receiptData
    });
  } catch (error) {
    next(error);
  }
}
