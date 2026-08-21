import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address format'),
    password: z.string().min(6, 'Password must be at least 6 characters long')
  })
});

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email address format'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    role: z.enum(['ADMIN', 'OPERATIONS_USER', 'SALES_USER'], {
      required_error: 'Role must be ADMIN, OPERATIONS_USER, or SALES_USER'
    }),
    locationId: z.string().optional().nullable()
  })
});
