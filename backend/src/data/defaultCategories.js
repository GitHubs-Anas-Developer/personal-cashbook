export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', type: 'income', color: '#10B981', icon: 'briefcase', isSystem: true },
  { name: 'Freelance & Business', type: 'income', color: '#059669', icon: 'laptop', isSystem: true },
  { name: 'Investments & Returns', type: 'income', color: '#14B8A6', icon: 'trending-up', isSystem: true },
  { name: 'Gifts & Grants', type: 'income', color: '#34D399', icon: 'gift', isSystem: true },
  { name: 'Rental Income', type: 'income', color: '#047857', icon: 'home', isSystem: true },
  { name: 'Other Income', type: 'income', color: '#6EE7B7', icon: 'plus-circle', isSystem: true }
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Groceries & Supplies', type: 'expense', color: '#EF4444', icon: 'shopping-cart', isSystem: true },
  { name: 'Housing & Rent', type: 'expense', color: '#DC2626', icon: 'home', isSystem: true },
  { name: 'Utilities & Bills', type: 'expense', color: '#F97316', icon: 'zap', isSystem: true },
  { name: 'Transportation & Fuel', type: 'expense', color: '#F59E0B', icon: 'car', isSystem: true },
  { name: 'Dining & Food Delivery', type: 'expense', color: '#FB923C', icon: 'utensils', isSystem: true },
  { name: 'Healthcare & Medicine', type: 'expense', color: '#EC4899', icon: 'heart-pulse', isSystem: true },
  { name: 'Shopping & Apparel', type: 'expense', color: '#8B5CF6', icon: 'shopping-bag', isSystem: true },
  { name: 'Entertainment & Leisure', type: 'expense', color: '#6366F1', icon: 'film', isSystem: true },
  { name: 'Education & Books', type: 'expense', color: '#3B82F6', icon: 'book-open', isSystem: true },
  { name: 'Personal Care', type: 'expense', color: '#D946EF', icon: 'sparkles', isSystem: true },
  { name: 'Subscriptions & Services', type: 'expense', color: '#64748B', icon: 'repeat', isSystem: true },
  { name: 'Debt & Interest', type: 'expense', color: '#991B1B', icon: 'credit-card', isSystem: true },
  { name: 'Miscellaneous', type: 'expense', color: '#94A3B8', icon: 'help-circle', isSystem: true }
];

export const DEFAULT_WALLETS = [
  { name: 'Primary Bank', type: 'bank', color: '#4F46E5', icon: 'building-2', isDefault: true, openingBalanceMinor: 0 },
  { name: 'Cash in Hand', type: 'cash', color: '#10B981', icon: 'banknote', isDefault: false, openingBalanceMinor: 0 },
  { name: 'UPI Digital Wallet', type: 'upi', color: '#8B5CF6', icon: 'smartphone', isDefault: false, openingBalanceMinor: 0 },
  { name: 'Emergency Savings', type: 'savings', color: '#06B6D4', icon: 'piggy-bank', isDefault: false, openingBalanceMinor: 0 }
];
