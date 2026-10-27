import express from 'express';
import * as reportController from '../controllers/reportController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { reportQuerySchema } from '../validators/reportValidators.js';

const router = express.Router();

router.use(authenticate);

router.get('/dashboard', reportController.getDashboardOverview);
router.get('/summary', validate(reportQuerySchema, 'query'), reportController.getReportSummary);
router.get('/cashflow', reportController.getCashFlowChartData);

export default router;
