import * as savingsGoalService from '../services/savingsGoalService.js';

export async function listGoals(req, res, next) {
  try {
    const goals = await savingsGoalService.getUserSavingsGoals(req.userId);
    res.json({
      success: true,
      data: goals
    });
  } catch (error) {
    next(error);
  }
}

export async function createGoal(req, res, next) {
  try {
    const goal = await savingsGoalService.createSavingsGoal(req.userId, req.body);
    res.status(201).json({
      success: true,
      message: 'Savings goal created successfully',
      data: goal
    });
  } catch (error) {
    next(error);
  }
}

export async function updateGoal(req, res, next) {
  try {
    const goal = await savingsGoalService.updateSavingsGoal(req.userId, req.params.id, req.body);
    res.json({
      success: true,
      message: 'Savings goal updated successfully',
      data: goal
    });
  } catch (error) {
    next(error);
  }
}

export async function contributeGoal(req, res, next) {
  try {
    const goal = await savingsGoalService.contributeToSavingsGoal(req.userId, req.params.id, req.body);
    res.json({
      success: true,
      message: 'Contribution recorded successfully',
      data: goal
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteGoal(req, res, next) {
  try {
    const result = await savingsGoalService.deleteSavingsGoal(req.userId, req.params.id);
    res.json({
      success: true,
      message: 'Savings goal deleted successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}
