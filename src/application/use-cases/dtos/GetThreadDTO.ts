import * as z from 'zod';

export const GetThreadSchema = z.object({
  threadID: z.nanoid(),
});

export type GetThreadRequest = z.infer<typeof GetThreadSchema>;

export interface GetThreadResponse {
  data: {
    id: string;
    author_id: string;
    content: string;
    reply_count: number;
    created_at: string;
  };
  includes: {
    users: Array<{
      id: string;
      username: string;
    }>;
  };
}
