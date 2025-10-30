import * as z from 'zod';

export const GetReplySchema = z.object({
  replyID: z.nanoid(),
  threadID: z.nanoid(),
});

export type GetReplyRequest = z.infer<typeof GetReplySchema>;
