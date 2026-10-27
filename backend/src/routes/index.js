import express from 'express';
import authRoutes from './authRoutes.js';
import walletRoutes from './walletRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import budgetRoutes from './budgetRoutes.js';
import savingsGoalRoutes from './savingsGoalRoutes.js';
import debtRoutes from './debtRoutes.js';
import recurringRoutes from './recurringRoutes.js';
import reportRoutes from './reportRoutes.js';
import exportRoutes from './exportRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import userRoutes from './userRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/wallets', walletRoutes);
router.use('/categories', categoryRoutes);
router.use('/transactions', transactionRoutes);
router.use('/budgets', budgetRoutes);
router.use('/savings-goals', savingsGoalRoutes);
router.use('/debts', debtRoutes);
router.use('/recurring', recurringRoutes);
router.use('/reports', reportRoutes);
router.use('/export', exportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/users', userRoutes);

export default router;
