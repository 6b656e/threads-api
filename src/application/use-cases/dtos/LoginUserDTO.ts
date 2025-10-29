import * as z from 'zod';

export const LoginUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export type LoginUserRequest = z.infer<typeof LoginUserSchema>;

export interface LoginUserResponse {
  message: string;
  data: {
    access_token: string;
  };
}
