import { Router } from 'express';
import authRoutes from './auth.routes.js';
import masterRoutes from './master.routes.js';
import inventoryRoutes from './inventory.routes.js';
import workOrderRoutes from './work-order.routes.js';
import transferRoutes from './transfer.routes.js';
import customerOrderRoutes from './customer-order.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/master', masterRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/work-orders', workOrderRoutes);
router.use('/transfers', transferRoutes);
router.use('/customer-orders', customerOrderRoutes);

export default router;
