import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50),
  type: z.enum(['income', 'expense']),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').default('#4F46E5'),
  icon: z.string().default('tag'),
  parentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID').nullable().optional()
});

export const updateCategorySchema = createCategorySchema.partial();
