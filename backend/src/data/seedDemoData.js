import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { User } from '../models/User.js';
import { Wallet } from '../models/Wallet.js';
import { Category } from '../models/Category.js';
import { Transaction } from '../models/Transaction.js';
import { Budget } from '../models/Budget.js';
import { SavingsGoal } from '../models/SavingsGoal.js';
import { Debt } from '../models/Debt.js';
import { RecurringRule } from '../models/RecurringRule.js';
import { seedDefaultWalletsForUser } from '../services/walletService.js';
import { seedDefaultCategoriesForUser } from '../services/categoryService.js';
import { createTransaction } from '../services/transactionService.js';

async function seed() {
  try {
    await connectDatabase();
    console.log('[Seed] Connected to MongoDB. Seeding realistic demo data...');

    const demoEmail = 'arjun@example.com';
    let user = await User.findOne({ email: demoEmail });

    if (user) {
      console.log('[Seed] Cleaning up previous demo user records...');
      await Promise.all([
        Wallet.deleteMany({ userId: user._id }),
        Category.deleteMany({ userId: user._id }),
        Transaction.deleteMany({ userId: user._id }),
        Budget.deleteMany({ userId: user._id }),
        SavingsGoal.deleteMany({ userId: user._id }),
        Debt.deleteMany({ userId: user._id }),
        RecurringRule.deleteMany({ userId: user._id }),
        User.deleteOne({ _id: user._id })
      ]);
    }

    user = await User.create({
      name: 'Arjun Gupta',
      email: demoEmail,
      password: 'Password123!',
      isEmailVerified: true,
      preferences: {
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        theme: 'system'
      }
    });

    console.log('[Seed] Created demo user: arjun@example.com (Password: Password123!)');

    // Provision default categories & wallets
    await seedDefaultCategoriesForUser(user._id);
    await seedDefaultWalletsForUser(user._id, 'INR');

    const wallets = await Wallet.find({ userId: user._id });
    const bankWallet = wallets.find((w) => w.type === 'bank');
    const cashWallet = wallets.find((w) => w.type === 'cash');
    const savingsWallet = wallets.find((w) => w.type === 'savings');
    const upiWallet = wallets.find((w) => w.type === 'upi');

    // Update opening balances
    bankWallet.openingBalanceMinor = 4500000; // ₹45,000
    bankWallet.currentBalanceMinor = 4500000;
    await bankWallet.save();

    cashWallet.openingBalanceMinor = 350000; // ₹3,500
    cashWallet.currentBalanceMinor = 350000;
    await cashWallet.save();

    savingsWallet.openingBalanceMinor = 2500000; // ₹25,000
    savingsWallet.currentBalanceMinor = 2500000;
    await savingsWallet.save();

    const categories = await Category.find({ userId: user._id });
    const salaryCat = categories.find((c) => c.name === 'Salary');
    const freelanceCat = categories.find((c) => c.name === 'Freelance & Business');
    const groceriesCat = categories.find((c) => c.name === 'Groceries & Supplies');
    const diningCat = categories.find((c) => c.name === 'Dining & Food Delivery');
    const utilitiesCat = categories.find((c) => c.name === 'Utilities & Bills');
    const transportCat = categories.find((c) => c.name === 'Transportation & Fuel');
    const shoppingCat = categories.find((c) => c.name === 'Shopping & Apparel');

    const now = new Date();
    const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

    // 1. Post Income
    await createTransaction(user._id, {
      type: 'income',
      amountMinor: 8500000, // ₹85,000
      walletId: bankWallet._id,
      categoryId: salaryCat._id,
      date: daysAgo(25),
      description: 'Monthly Senior Engineer Salary'
    });

    await createTransaction(user._id, {
      type: 'income',
      amountMinor: 1800000, // ₹18,000
      walletId: bankWallet._id,
      categoryId: freelanceCat._id,
      date: daysAgo(14),
      description: 'Freelance Architectural Consultation'
    });

    // 2. Post Transfers
    await createTransaction(user._id, {
      type: 'transfer',
      amountMinor: 500000, // ₹5,000
      walletId: bankWallet._id,
      destinationWalletId: cashWallet._id,
      date: daysAgo(20),
      description: 'ATM Cash Withdrawal for weekly pocket cash'
    });

    await createTransaction(user._id, {
      type: 'transfer',
      amountMinor: 1000000, // ₹10,000
      walletId: bankWallet._id,
      destinationWalletId: upiWallet._id,
      date: daysAgo(18),
      description: 'Top-up UPI digital balance'
    });

    await createTransaction(user._id, {
      type: 'transfer',
      amountMinor: 1500000, // ₹15,000
      walletId: bankWallet._id,
      destinationWalletId: savingsWallet._id,
      date: daysAgo(10),
      description: 'Monthly auto-allocation to emergency savings'
    });

    // 3. Post Expenses
    const sampleExpenses = [
      { cat: groceriesCat, wallet: upiWallet, amount: 245000, desc: 'DMart Supermarket monthly essentials', days: 22, tags: ['groceries', 'household'] },
      { cat: diningCat, wallet: upiWallet, amount: 85000, desc: 'Swiggy Gourmet dinner delivery', days: 21, tags: ['food', 'weekend'] },
      { cat: utilitiesCat, wallet: bankWallet, amount: 185000, desc: 'Electricity & High-speed Fiber Internet', days: 19, tags: ['bills'] },
      { cat: transportCat, wallet: upiWallet, amount: 120000, desc: 'HPCL Petrol Fuel Tank top-up', days: 17, tags: ['fuel'] },
      { cat: diningCat, wallet: cashWallet, amount: 45000, desc: 'Coffee and snacks with team', days: 15, tags: ['coffee'] },
      { cat: groceriesCat, wallet: upiWallet, amount: 165000, desc: 'Nature Basket fresh produce & dairy', days: 12, tags: ['groceries'] },
      { cat: shoppingCat, wallet: bankWallet, amount: 349900, desc: 'Uniqlo winter apparel and shoes', days: 8, tags: ['clothing'] },
      { cat: diningCat, wallet: upiWallet, amount: 125000, desc: 'Weekend family dining at restaurant', days: 5, tags: ['dining'] },
      { cat: transportCat, wallet: upiWallet, amount: 65000, desc: 'Uber rides for client meetings', days: 3, tags: ['commute'] },
      { cat: groceriesCat, wallet: upiWallet, amount: 89000, desc: 'Mid-week fruits and vegetables', days: 1, tags: ['groceries'] }
    ];

    for (const exp of sampleExpenses) {
      await createTransaction(user._id, {
        type: 'expense',
        amountMinor: exp.amount,
        walletId: exp.wallet._id,
        categoryId: exp.cat._id,
        date: daysAgo(exp.days),
        description: exp.desc,
        tags: exp.tags
      });
    }

    // 4. Budgets
    await Budget.create({
      userId: user._id,
      name: 'Groceries & Household Budget',
      period: 'monthly',
      categoryId: groceriesCat._id,
      amountMinor: 1000000, // ₹10,000 limit
      alertThresholdPercent: 80
    });

    await Budget.create({
      userId: user._id,
      name: 'Dining & Entertainment Limit',
      period: 'monthly',
      categoryId: diningCat._id,
      amountMinor: 500000, // ₹5,000 limit
      alertThresholdPercent: 75
    });

    // 5. Savings Goals
    await SavingsGoal.create({
      userId: user._id,
      name: 'Emergency Rainy Day Reserve',
      targetAmountMinor: 10000000, // ₹100,000
      currentAmountMinor: 4000000, // ₹40,000
      walletId: savingsWallet._id,
      targetDate: new Date(now.getFullYear(), 11, 31),
      status: 'in_progress'
    });

    await SavingsGoal.create({
      userId: user._id,
      name: 'Japan Vacation Fund',
      targetAmountMinor: 25000000, // ₹250,000
      currentAmountMinor: 7500000, // ₹75,000
      walletId: savingsWallet._id,
      targetDate: new Date(now.getFullYear() + 1, 4, 30),
      status: 'in_progress'
    });

    // 6. Debts (Money Lent & Borrowed)
    await Debt.create({
      userId: user._id,
      type: 'lent',
      personName: 'Rohan Sharma',
      personContact: '+91 98230 11223',
      initialAmountMinor: 1500000, // ₹15,000
      remainingAmountMinor: 800000, // ₹8,000 remaining
      dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 15),
      status: 'active',
      notes: 'Emergency medical loan assistance'
    });

    await Debt.create({
      userId: user._id,
      type: 'borrowed',
      personName: 'HDFC Personal Credit Line',
      personContact: 'Ref: #LN-89210',
      initialAmountMinor: 5000000, // ₹50,000
      remainingAmountMinor: 2000000, // ₹20,000 remaining
      dueDate: new Date(now.getFullYear(), now.getMonth() + 2, 10),
      status: 'active',
      notes: 'Electronics purchase installment'
    });

    // 7. Recurring Rules
    await RecurringRule.create({
      userId: user._id,
      title: 'House Apartment Rent',
      type: 'expense',
      amountMinor: 2200000, // ₹22,000
      frequency: 'monthly',
      walletId: bankWallet._id,
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      nextRunDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      description: 'Monthly flat rent transfer'
    });

    await RecurringRule.create({
      userId: user._id,
      title: 'Fiber Internet & OTT Subscriptions',
      type: 'expense',
      amountMinor: 149900, // ₹1,499
      frequency: 'monthly',
      walletId: bankWallet._id,
      categoryId: utilitiesCat._id,
      startDate: new Date(now.getFullYear(), now.getMonth(), 5),
      nextRunDate: new Date(now.getFullYear(), now.getMonth() + 1, 5),
      description: 'Airtel Xstream & Netflix'
    });

    console.log('[Seed] Demo data seeded successfully!');
    await disconnectDatabase();
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Error seeding demo data:', err);
    process.exit(1);
  }
}

seed();
