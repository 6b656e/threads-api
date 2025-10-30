import * as z from 'zod';

export const GetThreadSchema = z.object({
  threadID: z.nanoid(),
});

export type GetThreadRequest = z.infer<typeof GetThreadSchema>;
