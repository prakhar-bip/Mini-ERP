import { z } from 'zod';

export const addInventorySchema = z.object({
  body: z.object({
    itemId: z.string().min(1, 'Item ID is required'),
    locationId: z.string().min(1, 'Location ID is required'),
    batch: z.string().min(1, 'Batch number is required'),
    physicalQty: z.number().int().min(1, 'Physical quantity must be a positive integer')
  })
});

export const adjustStockSchema = z.object({
  body: z.object({
    inventoryId: z.string().min(1, 'Inventory ID is required'),
    adjustmentQty: z.number().int().refine((val) => val !== 0, {
      message: 'Adjustment quantity cannot be zero'
    })
  })
});
