import { z } from 'zod';
import { config } from '../config/index.js';

export const createSavingsGoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required').max(100),
  targetAmountMinor: z
    .number()
    .int()
    .min(config.minAmountMinor, 'Target amount must be positive')
    .max(config.maxAmountMinor),
  currentAmountMinor: z.number().int().min(0).default(0),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'CAD', 'AUD', 'JPY']).default('INR'),
  targetDate: z.string().or(z.date()).nullable().optional(),
  walletId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid wallet ID').nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#10B981'),
  icon: z.string().default('piggy-bank')
});

export const updateSavingsGoalSchema = createSavingsGoalSchema.partial();

export const contributeGoalSchema = z.object({
  amountMinor: z.number().int().min(1),
  walletId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional()
});
