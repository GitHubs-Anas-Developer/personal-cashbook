import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  preferences: z
    .object({
      currency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'CAD', 'AUD', 'JPY']).optional(),
      timezone: z.string().optional(),
      language: z.string().optional(),
      theme: z.enum(['light', 'dark', 'system']).optional(),
      dateFormat: z.string().optional(),
      notificationAlerts: z.boolean().optional()
    })
    .optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password confirmation is required for account deletion'),
  confirmationPhrase: z.literal('DELETE MY ACCOUNT')
});
