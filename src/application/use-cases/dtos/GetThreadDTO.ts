import * as z from 'zod';

export const GetThreadSchema = z.object({
  threadID: z.nanoid(),
});

export type GetThreadRequest = z.infer<typeof GetThreadSchema>;

export interface GetThreadResponse {
  thread: {
    id: string;
    authorID: string;
    content: string;
    replyCount: number;
    createdAt: Date;
  };
  authors: Array<{
    id: string;
    username: string;
  }>;
}
