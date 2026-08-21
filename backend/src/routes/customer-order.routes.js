import { Router } from 'express';
import { customerOrderController } from '../controllers/customer-order.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createCustomerOrderSchema } from '../validators/customer-order.validator.js';

const router = Router();

router.use(authenticate);

// View customer orders
router.get('/', (req, res, next) => customerOrderController.getCustomerOrders(req, res, next));
router.get('/:id', (req, res, next) => customerOrderController.getCustomerOrderById(req, res, next));

// Create Order & Reserve Stock (ADMIN and SALES_USER)
router.post(
  '/',
  authorize(['ADMIN', 'SALES_USER']),
  validate(createCustomerOrderSchema),
  (req, res, next) => customerOrderController.createCustomerOrder(req, res, next)
);

// Cancel Order & Release Stock (ADMIN and SALES_USER)
router.post(
  '/:id/cancel',
  authorize(['ADMIN', 'SALES_USER']),
  (req, res, next) => customerOrderController.cancelCustomerOrder(req, res, next)
);

export default router;
