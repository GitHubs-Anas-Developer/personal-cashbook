import express from 'express';
import * as savingsGoalController from '../controllers/savingsGoalController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import {
  createSavingsGoalSchema,
  updateSavingsGoalSchema,
  contributeGoalSchema
} from '../validators/savingsGoalValidators.js';

const router = express.Router();

router.use(authenticate);

router.get('/', savingsGoalController.listGoals);
router.post('/', validate(createSavingsGoalSchema), savingsGoalController.createGoal);
router.put('/:id', validate(updateSavingsGoalSchema), savingsGoalController.updateGoal);
router.post('/:id/contribute', validate(contributeGoalSchema), savingsGoalController.contributeGoal);
router.delete('/:id', savingsGoalController.deleteGoal);

export default router;
