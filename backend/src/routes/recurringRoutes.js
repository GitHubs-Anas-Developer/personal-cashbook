import express from 'express';
import * as recurringController from '../controllers/recurringController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import {
  createRecurringRuleSchema,
  updateRecurringRuleSchema
} from '../validators/recurringValidators.js';

const router = express.Router();

router.use(authenticate);

router.get('/', recurringController.listRecurringRules);
router.post('/', validate(createRecurringRuleSchema), recurringController.createRecurringRule);
router.put('/:id', validate(updateRecurringRuleSchema), recurringController.updateRecurringRule);
router.post('/:id/process', recurringController.processDueRule);
router.delete('/:id', recurringController.deleteRecurringRule);

export default router;
