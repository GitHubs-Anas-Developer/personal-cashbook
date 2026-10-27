import { z } from 'zod';
import { config } from '../config/index.js';

export const createWalletSchema = z.object({
  name: z.string().min(1, 'Wallet name is required').max(60),
  type: z.enum(['cash', 'bank', 'savings', 'upi', 'credit_card', 'other']).default('bank'),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'CAD', 'AUD', 'JPY']).default('INR'),
  openingBalanceMinor: z
    .number()
    .int('Opening balance must be an integer')
    .min(-config.maxAmountMinor, 'Amount too low')
    .max(config.maxAmountMinor, 'Amount too high')
    .default(0),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').default('#4F46E5'),
  icon: z.string().default('wallet'),
  accountNumberLast4: z.string().max(4).optional().default(''),
  upiId: z.string().max(100).optional().default(''),
  isDefault: z.boolean().optional().default(false)
});

export const updateWalletSchema = createWalletSchema.partial();
