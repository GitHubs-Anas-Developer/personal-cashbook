import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import {
  updateProfileSchema,
  changePasswordSchema,
  deleteAccountSchema
} from '../validators/userValidators.js';

const router = express.Router();

router.use(authenticate);

router.get('/profile', userController.getProfile);
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);
router.post('/change-password', validate(changePasswordSchema), userController.changePassword);
router.get('/export-all-data', userController.exportAllData);
router.delete('/delete-account', validate(deleteAccountSchema), userController.deleteAccount);
router.get('/sessions', userController.listSessions);
router.delete('/sessions/:sessionId', userController.revokeSession);

export default router;
