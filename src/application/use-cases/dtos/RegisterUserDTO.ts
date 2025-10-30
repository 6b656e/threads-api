import * as z from 'zod';

export const RegisterUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type RegisterUserRequest = z.infer<typeof RegisterUserSchema>;
