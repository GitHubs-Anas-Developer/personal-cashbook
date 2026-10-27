import * as debtService from '../services/debtService.js';

export async function listDebts(req, res, next) {
  try {
    const { status } = req.query;
    const debts = await debtService.getUserDebts(req.userId, status);
    res.json({
      success: true,
      data: debts
    });
  } catch (error) {
    next(error);
  }
}

export async function getDebt(req, res, next) {
  try {
    const debt = await debtService.getDebtById(req.userId, req.params.id);
    res.json({
      success: true,
      data: debt
    });
  } catch (error) {
    next(error);
  }
}

export async function createDebt(req, res, next) {
  try {
    const debt = await debtService.createDebt(req.userId, req.body);
    res.status(201).json({
      success: true,
      message: 'Debt recorded successfully',
      data: debt
    });
  } catch (error) {
    next(error);
  }
}

export async function updateDebt(req, res, next) {
  try {
    const debt = await debtService.updateDebt(req.userId, req.params.id, req.body);
    res.json({
      success: true,
      message: 'Debt updated successfully',
      data: debt
    });
  } catch (error) {
    next(error);
  }
}

export async function recordPayment(req, res, next) {
  try {
    const result = await debtService.recordDebtPayment(req.userId, req.params.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Payment recorded and ledger reconciled successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteDebt(req, res, next) {
  try {
    const result = await debtService.deleteDebt(req.userId, req.params.id);
    res.json({
      success: true,
      message: 'Debt deleted successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}
