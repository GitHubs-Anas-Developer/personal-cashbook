import express from 'express';
import * as categoryController from '../controllers/categoryController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { createCategorySchema, updateCategorySchema } from '../validators/categoryValidators.js';

const router = express.Router();

router.use(authenticate);

router.get('/', categoryController.listCategories);
router.post('/', validate(createCategorySchema), categoryController.createCategory);
router.put('/:id', validate(updateCategorySchema), categoryController.updateCategory);
router.patch('/:id/archive', categoryController.archiveCategory);

export default router;
