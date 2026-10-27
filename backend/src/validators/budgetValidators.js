import { z } from 'zod';
import { config } from '../config/index.js';

export const createBudgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required').max(100),
  period: z.enum(['weekly', 'monthly', 'yearly']).default('monthly'),
  categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID').nullable().optional(),
  amountMinor: z
    .number()
    .int('Amount must be an integer')
    .min(config.minAmountMinor, 'Budget amount must be positive')
    .max(config.maxAmountMinor),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'CAD', 'AUD', 'JPY']).default('INR'),
  startDate: z.string().or(z.date()).optional().default(() => new Date()),
  endDate: z.string().or(z.date()).nullable().optional(),
  alertThresholdPercent: z.number().min(1).max(100).default(80)
});

export const updateBudgetSchema = createBudgetSchema.partial();
