import * as z from 'zod';

export const LogoutUserSchema = z.object({
  accessToken: z.jwt({ alg: 'HS256' }),
  userID: z.nanoid(),
  tokenExpiresAt: z.date(),
});

export type LogoutUserRequest = z.infer<typeof LogoutUserSchema>;
