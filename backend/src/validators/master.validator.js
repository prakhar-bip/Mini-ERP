import { z } from 'zod';

export const createLocationSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Location name is required'),
    code: z.string().min(2, 'Location code is required (e.g. WH-01)'),
    address: z.string().optional()
  })
});

export const createItemSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Item name is required'),
    sku: z.string().min(2, 'SKU is required (e.g. ITEM-01)'),
    category: z.string().min(2, 'Category is required'),
    unit: z.string().default('PCS')
  })
});
