import { z } from 'zod';
import { config } from '../config/index.js';

export const createTransactionSchema = z
  .object({
    type: z.enum(['income', 'expense', 'transfer', 'refund', 'reversal']),
    amountMinor: z
      .number()
      .int('Amount must be an integer (in minor units/paise)')
      .min(config.minAmountMinor, 'Amount must be greater than zero')
      .max(config.maxAmountMinor, 'Amount exceeds maximum permitted limit'),
    currency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'CAD', 'AUD', 'JPY']).default('INR'),
    date: z.string().or(z.date()).optional().default(() => new Date()),
    walletId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid wallet ID'),
    destinationWalletId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid destination wallet ID')
      .nullable()
      .optional(),
    categoryId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID')
      .nullable()
      .optional(),
    description: z.string().min(1, 'Description is required').max(200),
    tags: z.array(z.string().trim().max(30)).optional().default([]),
    notes: z.string().max(1000).optional().default(''),
    reversalDirection: z.enum(['credit', 'debit']).nullable().optional(),
    idempotencyKey: z.string().max(100).optional(),
    linkedTransactionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid linked transaction ID').nullable().optional(),
    linkedDebtId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid linked debt ID').nullable().optional(),
    linkedSavingsGoalId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid linked savings goal ID').nullable().optional()
  })
  .refine(
    (data) => {
      if (data.type === 'transfer') {
        return !!data.destinationWalletId && data.walletId !== data.destinationWalletId;
      }
      return true;
    },
    {
      message: 'Transfers require a distinct destination wallet',
      path: ['destinationWalletId']
    }
  )
  .refine(
    (data) => {
      if (['income', 'expense'].includes(data.type)) {
        if (data.linkedDebtId || data.linkedSavingsGoalId) {
          return true;
        }
        return !!data.categoryId;
      }
      return true;
    },
    {
      message: 'Category is required for income and expense transactions',
      path: ['categoryId']
    }
  );

export const updateTransactionSchema = z.object({
  amountMinor: z
    .number()
    .int()
    .min(config.minAmountMinor)
    .max(config.maxAmountMinor)
    .optional(),
  date: z.string().or(z.date()).optional(),
  walletId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  destinationWalletId: z.string().regex(/^[0-9a-fA-F]{24}$/).nullable().optional(),
  categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/).nullable().optional(),
  description: z.string().min(1).max(200).optional(),
  tags: z.array(z.string().trim().max(30)).optional(),
  notes: z.string().max(1000).optional()
});

export const listTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  type: z.enum(['income', 'expense', 'transfer', 'refund', 'reversal', 'all']).optional(),
  walletId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minAmountMinor: z.coerce.number().int().optional(),
  maxAmountMinor: z.coerce.number().int().optional(),
  tag: z.string().optional(),
  sortBy: z.enum(['date', 'amountMinor', 'createdAt']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});
