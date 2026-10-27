import express from 'express';
import * as transactionController from '../controllers/transactionController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { receiptUpload } from '../middlewares/uploadMiddleware.js';
import {
  createTransactionSchema,
  updateTransactionSchema,
  listTransactionsQuerySchema
} from '../validators/transactionValidators.js';

const router = express.Router();

router.use(authenticate);

router.get('/', validate(listTransactionsQuerySchema, 'query'), transactionController.listTransactions);
router.post('/', validate(createTransactionSchema), transactionController.createTransaction);
router.post('/upload-receipt', receiptUpload.single('receipt'), transactionController.uploadReceipt);
router.get('/:id', transactionController.getTransaction);
router.put('/:id', validate(updateTransactionSchema), transactionController.updateTransaction);
router.post('/:id/reverse', transactionController.reverseTransaction);
router.delete('/:id', transactionController.deleteTransaction);

export default router;
