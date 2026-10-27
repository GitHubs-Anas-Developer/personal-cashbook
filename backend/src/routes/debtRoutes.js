import express from 'express';
import * as debtController from '../controllers/debtController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import {
  createDebtSchema,
  updateDebtSchema,
  createDebtPaymentSchema
} from '../validators/debtValidators.js';

const router = express.Router();

router.use(authenticate);

router.get('/', debtController.listDebts);
router.post('/', validate(createDebtSchema), debtController.createDebt);
router.get('/:id', debtController.getDebt);
router.put('/:id', validate(updateDebtSchema), debtController.updateDebt);
router.post('/:id/payments', validate(createDebtPaymentSchema), debtController.recordPayment);
router.delete('/:id', debtController.deleteDebt);

export default router;
