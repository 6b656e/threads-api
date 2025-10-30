import * as z from 'zod';

export const GetAuthorTimelineSchema = z.object({
  authorID: z.nanoid(),
});

export type GetAuthorTimelineRequest = z.infer<typeof GetAuthorTimelineSchema>;
