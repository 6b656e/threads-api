import * as z from 'zod';

export const ReplyThreadSchema = z.object({
  authorID: z.nanoid(),
  threadID: z.nanoid(),
  content: z.string(),
});

export type ReplyThreadRequest = z.infer<typeof ReplyThreadSchema>;

export interface ReplyThreadResponse {
  message: string;
  data: {
    id: string;
  };
}
