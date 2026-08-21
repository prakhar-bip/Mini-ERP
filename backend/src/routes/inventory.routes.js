import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { addInventorySchema, adjustStockSchema } from '../validators/inventory.validator.js';

const router = Router();

router.use(authenticate);

// List inventory & inventory summary (accessible to all authenticated roles)
router.get('/', (req, res, next) => inventoryController.getInventories(req, res, next));
router.get('/summary', (req, res, next) => inventoryController.getSummary(req, res, next));

// Stock modification (restricted to ADMIN and OPERATIONS_USER)
router.post(
  '/add',
  authorize(['ADMIN', 'OPERATIONS_USER']),
  validate(addInventorySchema),
  (req, res, next) => inventoryController.addStock(req, res, next)
);

router.post(
  '/adjust',
  authorize(['ADMIN', 'OPERATIONS_USER']),
  validate(adjustStockSchema),
  (req, res, next) => inventoryController.adjustStock(req, res, next)
);

export default router;
