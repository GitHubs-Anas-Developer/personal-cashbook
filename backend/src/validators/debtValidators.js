import { z } from 'zod';
import { config } from '../config/index.js';

export const createDebtSchema = z.object({
  type: z.enum(['lent', 'borrowed']),
  personName: z.string().min(1, 'Person or institution name is required').max(100),
  personContact: z.string().max(100).optional().default(''),
  initialAmountMinor: z
    .number()
    .int()
    .min(config.minAmountMinor, 'Amount must be positive')
    .max(config.maxAmountMinor),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'CAD', 'AUD', 'JPY']).default('INR'),
  walletId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid wallet ID').nullable().optional(),
  dueDate: z.string().or(z.date()).nullable().optional(),
  interestRatePercent: z.number().min(0).max(100).default(0),
  notes: z.string().max(1000).optional().default('')
});

export const updateDebtSchema = z.object({
  personName: z.string().min(1).max(100).optional(),
  personContact: z.string().max(100).optional(),
  dueDate: z.string().or(z.date()).nullable().optional(),
  interestRatePercent: z.number().min(0).max(100).optional(),
  status: z.enum(['active', 'settled', 'defaulted']).optional(),
  notes: z.string().max(1000).optional()
});

export const createDebtPaymentSchema = z.object({
  amountMinor: z
    .number()
    .int()
    .min(config.minAmountMinor, 'Payment must be positive')
    .max(config.maxAmountMinor),
  walletId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid wallet ID'),
  date: z.string().or(z.date()).optional().default(() => new Date()),
  notes: z.string().max(500).optional().default('')
});
