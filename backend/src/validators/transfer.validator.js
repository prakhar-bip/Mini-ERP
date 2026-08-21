import { z } from 'zod';

export const createTransferSchema = z.object({
  body: z.object({
    transferNumber: z.string().optional(),
    sourceLocationId: z.string().min(1, 'Source location ID is required'),
    destLocationId: z.string().min(1, 'Destination location ID is required'),
    itemId: z.string().min(1, 'Item ID is required'),
    quantity: z.number().int().min(1, 'Transfer quantity must be greater than 0')
  }).refine((data) => data.sourceLocationId !== data.destLocationId, {
    message: 'Source and Destination locations must be different',
    path: ['destLocationId']
  })
});
