import { Router } from 'express';
import { workOrderController } from '../controllers/work-order.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createWorkOrderSchema, updateWorkOrderStatusSchema } from '../validators/work-order.validator.js';

const router = Router();

router.use(authenticate);

// View work orders
router.get('/', (req, res, next) => workOrderController.getWorkOrders(req, res, next));
router.get('/:id', (req, res, next) => workOrderController.getWorkOrderById(req, res, next));

// Create Work Order (Strictly restricted to ADMIN)
router.post(
  '/',
  authorize(['ADMIN']),
  validate(createWorkOrderSchema),
  (req, res, next) => workOrderController.createWorkOrder(req, res, next)
);

// Update Status (ADMIN and OPERATIONS_USER)
router.patch(
  '/:id/status',
  authorize(['ADMIN', 'OPERATIONS_USER']),
  validate(updateWorkOrderStatusSchema),
  (req, res, next) => workOrderController.updateStatus(req, res, next)
);

export default router;
