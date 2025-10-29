import * as z from 'zod';

export const GetUserProfileSchema = z.object({
  userID: z.nanoid(),
});

export type GetUserProfileRequest = z.infer<typeof GetUserProfileSchema>;

export interface GetUserProfileResponse {
  data: {
    id: string;
    username: string;
    thread_count: number;
    reply_count: number;
    created_at: string;
  };
}
