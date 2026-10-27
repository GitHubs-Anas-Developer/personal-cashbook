import { z } from 'zod';

export const reportQuerySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'custom']).default('monthly'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  walletId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'CAD', 'AUD', 'JPY']).optional()
});

export const exportQuerySchema = z.object({
  format: z.enum(['csv', 'pdf']).default('csv'),
  type: z.enum(['transactions', 'summary', 'category_breakdown']).default('transactions'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  walletId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional()
});
