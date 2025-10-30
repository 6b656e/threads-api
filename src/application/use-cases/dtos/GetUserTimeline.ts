import * as z from 'zod';

export const GetUserTimelineSchema = z.object({
  userID: z.nanoid(),
});

export type GetUserTimelineRequest = z.infer<typeof GetUserTimelineSchema>;

export interface GetUserTimelineResponse {
  replies: Array<{
    id: string;
    threadID: string;
    authorID: string;
    content: string;
    createdAt: Date;
  }>;
  threads: Array<{
    id: string;
    authorID: string;
    content: string;
    createdAt: Date;
  }>;
  users: Array<{
    id: string;
    username: string;
  }>;
}
