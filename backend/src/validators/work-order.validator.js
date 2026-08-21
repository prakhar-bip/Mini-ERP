import { z } from 'zod';

export const createWorkOrderSchema = z.object({
  body: z.object({
    orderNumber: z.string().optional(),
    locationId: z.string().min(1, 'Location ID is required'),
    itemId: z.string().min(1, 'Item ID is required'),
    requiredQty: z.number().int().min(1, 'Required quantity must be greater than 0'),
    assignedUserId: z.string().min(1, 'Assigned user ID is required'),
    status: z.enum(['ASSIGNED', 'IN_PROGRESS', 'COMPLETED']).default('ASSIGNED')
  })
});

export const updateWorkOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'])
  })
});
