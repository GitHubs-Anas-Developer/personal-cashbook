import { Category } from '../models/Category.js';
import { DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '../data/defaultCategories.js';

export async function seedDefaultCategoriesForUser(userId) {
  const existing = await Category.countDocuments({ userId });
  if (existing > 0) return;

  const categoriesToInsert = [
    ...DEFAULT_INCOME_CATEGORIES.map((c) => ({ ...c, userId })),
    ...DEFAULT_EXPENSE_CATEGORIES.map((c) => ({ ...c, userId }))
  ];

  await Category.insertMany(categoriesToInsert);
}

export async function getUserCategories(userId, type = null) {
  const filter = { userId, isArchived: false };
  if (type) {
    filter.type = type;
  }
  return await Category.find(filter).sort({ name: 1 }).lean();
}

export async function createCategory(userId, categoryData) {
  const category = await Category.create({
    ...categoryData,
    userId,
    isSystem: false
  });
  return category;
}

export async function updateCategory(userId, categoryId, updateData) {
  const category = await Category.findOneAndUpdate(
    { _id: categoryId, userId },
    { $set: updateData },
    { new: true }
  );
  if (!category) {
    throw new Error('Category not found or access denied');
  }
  return category;
}

export async function archiveCategory(userId, categoryId) {
  const category = await Category.findOneAndUpdate(
    { _id: categoryId, userId },
    { $set: { isArchived: true } },
    { new: true }
  );
  if (!category) {
    throw new Error('Category not found or access denied');
  }
  return category;
}
