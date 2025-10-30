import * as z from 'zod';

export const GetUserProfileSchema = z.object({
  userID: z.nanoid(),
});

export type GetUserProfileRequest = z.infer<typeof GetUserProfileSchema>;

export interface GetUserProfileResponse {
  id: string;
  username: string;
  threadCount: number;
  replyCount: number;
  createdAt: Date;
}
