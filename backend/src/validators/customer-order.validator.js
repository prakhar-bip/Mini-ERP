import { z } from 'zod';

export const createCustomerOrderSchema = z.object({
  body: z.object({
    orderNumber: z.string().optional(),
    customerName: z.string().min(2, 'Customer name is required'),
    locationId: z.string().min(1, 'Location ID is required'),
    itemId: z.string().min(1, 'Item ID is required'),
    quantity: z.number().int().min(1, 'Order quantity must be at least 1')
  })
});
