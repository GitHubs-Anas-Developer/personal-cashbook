import * as recurringService from '../services/recurringService.js';

export async function listRecurringRules(req, res, next) {
  try {
    const rules = await recurringService.getUserRecurringRules(req.userId);
    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    next(error);
  }
}

export async function createRecurringRule(req, res, next) {
  try {
    const rule = await recurringService.createRecurringRule(req.userId, req.body);
    res.status(201).json({
      success: true,
      message: 'Recurring rule created successfully',
      data: rule
    });
  } catch (error) {
    next(error);
  }
}

export async function updateRecurringRule(req, res, next) {
  try {
    const rule = await recurringService.updateRecurringRule(req.userId, req.params.id, req.body);
    res.json({
      success: true,
      message: 'Recurring rule updated successfully',
      data: rule
    });
  } catch (error) {
    next(error);
  }
}

export async function processDueRule(req, res, next) {
  try {
    const result = await recurringService.processDueRecurringRule(req.userId, req.params.id);
    res.json({
      success: true,
      message: 'Recurring rule processed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteRecurringRule(req, res, next) {
  try {
    const result = await recurringService.deleteRecurringRule(req.userId, req.params.id);
    res.json({
      success: true,
      message: 'Recurring rule deleted successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}
