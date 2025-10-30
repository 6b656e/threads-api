import * as z from 'zod';

export const GetReplySchema = z.object({
  replyID: z.nanoid(),
  threadID: z.nanoid(),
});

export type GetReplyRequest = z.infer<typeof GetReplySchema>;

export interface GetReplyResponse {
  reply: {
    id: string;
    threadID: string;
    authorID: string;
    content: string;
    createdAt: Date;
  };
  threads: Array<{
    id: string;
    authorID: string;
    content: string;
    createdAt: Date;
  }>;
  authors: Array<{
    id: string;
    username: string;
  }>;
}
