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

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Employee name is required'),
    email: z.string().email('Valid email address is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['ADMIN', 'OPERATIONS_USER', 'SALES_USER'], {
      required_error: 'Role must be ADMIN, OPERATIONS_USER, or SALES_USER'
    }),
    locationId: z.string().optional().nullable()
  })
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional().nullable().or(z.literal('')),
    role: z.enum(['ADMIN', 'OPERATIONS_USER', 'SALES_USER']).optional(),
    locationId: z.string().optional().nullable()
  })
});
