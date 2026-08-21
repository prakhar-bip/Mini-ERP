import { Router } from 'express';
import { transferController } from '../controllers/transfer.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createTransferSchema } from '../validators/transfer.validator.js';

const router = Router();

router.use(authenticate);

// View transfers
router.get('/', (req, res, next) => transferController.getTransfers(req, res, next));
router.get('/:id', (req, res, next) => transferController.getTransferById(req, res, next));

// Request, Dispatch, and Receive Transfers (ADMIN and OPERATIONS_USER)
router.post(
  '/',
  authorize(['ADMIN', 'OPERATIONS_USER']),
  validate(createTransferSchema),
  (req, res, next) => transferController.createTransfer(req, res, next)
);

router.post(
  '/:id/dispatch',
  authorize(['ADMIN', 'OPERATIONS_USER']),
  (req, res, next) => transferController.dispatchTransfer(req, res, next)
);

router.post(
  '/:id/receive',
  authorize(['ADMIN', 'OPERATIONS_USER']),
  (req, res, next) => transferController.receiveTransfer(req, res, next)
);

export default router;
