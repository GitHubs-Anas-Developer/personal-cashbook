import { z } from 'zod';
import { config } from '../config/index.js';

export const createRecurringRuleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  type: z.enum(['income', 'expense', 'transfer']),
  amountMinor: z
    .number()
    .int()
    .min(config.minAmountMinor, 'Amount must be positive')
    .max(config.maxAmountMinor),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'CAD', 'AUD', 'JPY']).default('INR'),
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
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']),
  startDate: z.string().or(z.date()).optional().default(() => new Date()),
  endDate: z.string().or(z.date()).nullable().optional(),
  autoProcess: z.boolean().default(false),
  description: z.string().max(200).optional().default('')
});

export const updateRecurringRuleSchema = createRecurringRuleSchema.partial().extend({
  status: z.enum(['active', 'paused', 'completed']).optional()
});
