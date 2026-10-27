import express from 'express';
import * as budgetController from '../controllers/budgetController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { createBudgetSchema, updateBudgetSchema } from '../validators/budgetValidators.js';

const router = express.Router();

router.use(authenticate);

router.get('/', budgetController.listBudgets);
router.post('/', validate(createBudgetSchema), budgetController.createBudget);
router.put('/:id', validate(updateBudgetSchema), budgetController.updateBudget);
router.delete('/:id', budgetController.deleteBudget);

export default router;
