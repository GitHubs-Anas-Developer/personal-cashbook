import * as categoryService from '../services/categoryService.js';

export async function listCategories(req, res, next) {
  try {
    const { type } = req.query;
    const categories = await categoryService.getUserCategories(req.userId, type);
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req, res, next) {
  try {
    const category = await categoryService.createCategory(req.userId, req.body);
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const category = await categoryService.updateCategory(req.userId, req.params.id, req.body);
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
}

export async function archiveCategory(req, res, next) {
  try {
    const category = await categoryService.archiveCategory(req.userId, req.params.id);
    res.json({
      success: true,
      message: 'Category archived successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
}
