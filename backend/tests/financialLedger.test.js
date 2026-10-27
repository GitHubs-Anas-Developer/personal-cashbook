import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { Wallet } from '../src/models/Wallet.js';
import { Category } from '../src/models/Category.js';
import { Transaction } from '../src/models/Transaction.js';
import { Budget } from '../src/models/Budget.js';
import { Debt } from '../src/models/Debt.js';
import { DebtPayment } from '../src/models/DebtPayment.js';
import * as transactionService from '../src/services/transactionService.js';
import * as walletService from '../src/services/walletService.js';
import * as reportService from '../src/services/reportService.js';
import * as budgetService from '../src/services/budgetService.js';
import * as debtService from '../src/services/debtService.js';

describe('Financial Correctness and Ledger Rules', () => {
  let testUser;
  let bankWallet;
  let cashWallet;
  let savingsWallet;
  let salaryCat;
  let groceriesCat;

  beforeAll(async () => {
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/personal_cashbook_test';
    await connectDatabase();
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await disconnectDatabase();
    }
  });

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();

    // Setup test user
    testUser = await User.create({
      name: 'Priya Sharma',
      email: 'priya@example.com',
      password: 'Password123!',
      isEmailVerified: true,
      preferences: { currency: 'INR' }
    });

    // Setup initial wallets with distinct opening balances
    bankWallet = await Wallet.create({
      userId: testUser._id,
      name: 'HDFC Salary Bank',
      type: 'bank',
      currency: 'INR',
      openingBalanceMinor: 5000000, // ₹50,000.00
      currentBalanceMinor: 5000000
    });

    cashWallet = await Wallet.create({
      userId: testUser._id,
      name: 'Cash in Hand',
      type: 'cash',
      currency: 'INR',
      openingBalanceMinor: 200000, // ₹2,000.00
      currentBalanceMinor: 200000
    });

    savingsWallet = await Wallet.create({
      userId: testUser._id,
      name: 'Emergency Fund',
      type: 'savings',
      currency: 'INR',
      openingBalanceMinor: 1000000, // ₹10,000.00
      currentBalanceMinor: 1000000
    });

    // Categories
    salaryCat = await Category.create({
      userId: testUser._id,
      name: 'Salary',
      type: 'income',
      color: '#10B981'
    });

    groceriesCat = await Category.create({
      userId: testUser._id,
      name: 'Groceries',
      type: 'expense',
      color: '#EF4444'
    });
  });

  it('RULE 1: Current balance reconciles with opening balance + income - expense', async () => {
    // Add income: ₹15,000 (1,500,000 paise)
    await transactionService.createTransaction(testUser._id, {
      type: 'income',
      amountMinor: 1500000,
      walletId: bankWallet._id,
      categoryId: salaryCat._id,
      description: 'Monthly Consulting Payout'
    });

    // Add expense: ₹3,000 (300,000 paise)
    await transactionService.createTransaction(testUser._id, {
      type: 'expense',
      amountMinor: 300000,
      walletId: bankWallet._id,
      categoryId: groceriesCat._id,
      description: 'Supermarket Groceries'
    });

    // Expected: 50,000 + 15,000 - 3,000 = ₹62,000 (6,200,000 paise)
    const reconciled = await walletService.reconcileWalletBalance(testUser._id, bankWallet._id);
    expect(reconciled).toBe(6200000);

    const updatedBank = await Wallet.findById(bankWallet._id);
    expect(updatedBank.currentBalanceMinor).toBe(6200000);
  });

  it('RULE 2: A transfer reduces source wallet and increases destination wallet by the exact same amount', async () => {
    const transferAmountMinor = 500000; // ₹5,000

    await transactionService.createTransaction(testUser._id, {
      type: 'transfer',
      amountMinor: transferAmountMinor,
      walletId: bankWallet._id,
      destinationWalletId: cashWallet._id,
      description: 'ATM Cash Withdrawal'
    });

    const bankReconciled = await walletService.reconcileWalletBalance(testUser._id, bankWallet._id);
    const cashReconciled = await walletService.reconcileWalletBalance(testUser._id, cashWallet._id);

    // Bank was 50,000 -> now 45,000
    expect(bankReconciled).toBe(4500000);
    // Cash was 2,000 -> now 7,000
    expect(cashReconciled).toBe(700000);
  });

  it('RULE 3: A transfer is NOT counted as income or expense in consolidated reports', async () => {
    // Perform transfer
    await transactionService.createTransaction(testUser._id, {
      type: 'transfer',
      amountMinor: 1000000,
      walletId: bankWallet._id,
      destinationWalletId: cashWallet._id,
      description: 'Transfer between own accounts'
    });

    const summary = await reportService.getFinancialSummary(testUser._id, { period: 'monthly' });

    expect(summary.totalIncomeMinor).toBe(0);
    expect(summary.totalExpenseMinor).toBe(0);
    expect(summary.netCashFlowMinor).toBe(0);
  });

  it('RULE 4: Savings transfers do NOT count as spending or expenses', async () => {
    await transactionService.createTransaction(testUser._id, {
      type: 'transfer',
      amountMinor: 400000, // ₹4,000 into savings
      walletId: bankWallet._id,
      destinationWalletId: savingsWallet._id,
      description: 'Allocation to Emergency Savings'
    });

    const summary = await reportService.getFinancialSummary(testUser._id, { period: 'monthly' });
    expect(summary.totalExpenseMinor).toBe(0);

    const savingsReconciled = await walletService.reconcileWalletBalance(testUser._id, savingsWallet._id);
    expect(savingsReconciled).toBe(1400000); // 10,000 + 4,000 = ₹14,000
  });

  it('RULE 5: Opening balances are NOT counted as income earned during the reporting period', async () => {
    const summary = await reportService.getFinancialSummary(testUser._id, { period: 'monthly' });
    expect(summary.totalIncomeMinor).toBe(0);

    // Total wallet balance includes opening balances: 50,000 + 2,000 + 10,000 = ₹62,000 (6,200,000 paise)
    expect(summary.totalWalletBalanceMinor).toBe(6200000);
  });

  it('RULE 6: Budget calculations exclude transfers and non-expense transactions', async () => {
    const groceryBudget = await Budget.create({
      userId: testUser._id,
      name: 'Groceries Budget',
      period: 'monthly',
      categoryId: groceriesCat._id,
      amountMinor: 500000 // ₹5,000 budget
    });

    // 1. Add ₹1,200 grocery expense
    await transactionService.createTransaction(testUser._id, {
      type: 'expense',
      amountMinor: 120000,
      walletId: bankWallet._id,
      categoryId: groceriesCat._id,
      description: 'Weekly veggies'
    });

    // 2. Add transfer of ₹2,000 from bank to cash
    await transactionService.createTransaction(testUser._id, {
      type: 'transfer',
      amountMinor: 200000,
      walletId: bankWallet._id,
      destinationWalletId: cashWallet._id,
      description: 'ATM withdrawal'
    });

    const budgetStats = await budgetService.calculateBudgetSpend(testUser._id, groceryBudget);

    // Spending should strictly be ₹1,200 (120,000 paise), excluding the transfer
    expect(budgetStats.spentMinor).toBe(120000);
    expect(budgetStats.percentage).toBe(24);
    expect(budgetStats.remainingMinor).toBe(380000);
  });

  it('RULE 7: Debt repayments do not double-count principal movement', async () => {
    // User lends ₹5,000 to friend Rohan from Bank
    const debt = await debtService.createDebt(testUser._id, {
      type: 'lent',
      personName: 'Rohan Verma',
      initialAmountMinor: 500000,
      currency: 'INR',
      walletId: bankWallet._id
    });

    // Bank wallet is reduced by ₹5,000 (50,000 - 5,000 = 45,000)
    const bankAfterLending = await walletService.reconcileWalletBalance(testUser._id, bankWallet._id);
    expect(bankAfterLending).toBe(4500000);

    // Friend repays partial amount ₹2,000 into Bank
    await debtService.recordDebtPayment(testUser._id, debt._id, {
      amountMinor: 200000,
      walletId: bankWallet._id,
      notes: 'First installment'
    });

    // Remaining debt should now be ₹3,000
    const updatedDebt = await Debt.findById(debt._id);
    expect(updatedDebt.remainingAmountMinor).toBe(300000);
    expect(updatedDebt.status).toBe('active');

    // Bank wallet has received the repayment (45,000 + 2,000 = 47,000)
    const bankAfterRepayment = await walletService.reconcileWalletBalance(testUser._id, bankWallet._id);
    expect(bankAfterRepayment).toBe(4700000);
  });

  it('RULE 8: Transaction reversal preserves auditability and restores wallet balances', async () => {
    // Create an expense of ₹1,000
    const tx = await transactionService.createTransaction(testUser._id, {
      type: 'expense',
      amountMinor: 100000,
      walletId: bankWallet._id,
      categoryId: groceriesCat._id,
      description: 'Accidental duplicate charge'
    });

    expect(await walletService.reconcileWalletBalance(testUser._id, bankWallet._id)).toBe(4900000);

    // Reverse the transaction
    await transactionService.reverseTransaction(testUser._id, tx._id, 'Duplicate entry reversed');

    // Reconciled balance must restore back to original ₹50,000
    const restoredBalance = await walletService.reconcileWalletBalance(testUser._id, bankWallet._id);
    expect(restoredBalance).toBe(5000000);
  });
});
