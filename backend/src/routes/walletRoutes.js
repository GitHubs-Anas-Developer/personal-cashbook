import express from 'express';
import * as walletController from '../controllers/walletController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { createWalletSchema, updateWalletSchema } from '../validators/walletValidators.js';

const router = express.Router();

router.use(authenticate);

router.get('/', walletController.listWallets);
router.post('/', validate(createWalletSchema), walletController.createWallet);
router.get('/:id', walletController.getWallet);
router.put('/:id', validate(updateWalletSchema), walletController.updateWallet);
router.patch('/:id/archive', walletController.archiveWallet);
router.patch('/:id/unarchive', walletController.unarchiveWallet);
router.post('/:id/reconcile', walletController.reconcileWallet);

export default router;
