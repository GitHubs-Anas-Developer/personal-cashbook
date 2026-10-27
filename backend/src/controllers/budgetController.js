import * as budgetService from '../services/budgetService.js';

export async function listBudgets(req, res, next) {
  try {
    const budgets = await budgetService.getUserBudgetsWithProgress(req.userId);
    res.json({
      success: true,
      data: budgets
    });
  } catch (error) {
    next(error);
  }
}

export async function createBudget(req, res, next) {
  try {
    const budget = await budgetService.createBudget(req.userId, req.body);
    res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      data: budget
    });
  } catch (error) {
    next(error);
  }
}

export async function updateBudget(req, res, next) {
  try {
    const budget = await budgetService.updateBudget(req.userId, req.params.id, req.body);
    res.json({
      success: true,
      message: 'Budget updated successfully',
      data: budget
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteBudget(req, res, next) {
  try {
    const result = await budgetService.deleteBudget(req.userId, req.params.id);
    res.json({
      success: true,
      message: 'Budget deleted successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}
