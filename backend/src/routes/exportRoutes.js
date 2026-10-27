import express from 'express';
import * as exportController from '../controllers/exportController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { exportQuerySchema } from '../validators/reportValidators.js';

const router = express.Router();

router.use(authenticate);

router.get('/download', validate(exportQuerySchema, 'query'), exportController.exportFinancialData);

export default router;
