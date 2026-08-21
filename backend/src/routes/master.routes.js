import { Router } from 'express';
import { locationController, itemController, userController } from '../controllers/master.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createLocationSchema, createItemSchema, createUserSchema, updateUserSchema } from '../validators/master.validator.js';

const router = Router();

// All master data routes require authentication
router.use(authenticate);

// Locations
router.get('/locations', (req, res, next) => locationController.getAllLocations(req, res, next));
router.post(
  '/locations',
  authorize(['ADMIN', 'OPERATIONS_USER']),
  validate(createLocationSchema),
  (req, res, next) => locationController.createLocation(req, res, next)
);

// Items
router.get('/items', (req, res, next) => itemController.getAllItems(req, res, next));
router.post(
  '/items',
  authorize(['ADMIN', 'OPERATIONS_USER']),
  validate(createItemSchema),
  (req, res, next) => itemController.createItem(req, res, next)
);

// Users / Employee Management
router.get('/users', (req, res, next) => userController.getAllUsers(req, res, next));
router.post(
  '/users',
  authorize(['ADMIN']),
  validate(createUserSchema),
  (req, res, next) => userController.createUser(req, res, next)
);
router.put(
  '/users/:id',
  authorize(['ADMIN']),
  validate(updateUserSchema),
  (req, res, next) => userController.updateUser(req, res, next)
);
router.delete(
  '/users/:id',
  authorize(['ADMIN']),
  (req, res, next) => userController.deleteUser(req, res, next)
);

export default router;
