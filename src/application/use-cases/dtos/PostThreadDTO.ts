import * as z from 'zod';

export const PostThreadSchema = z.object({
  authorID: z.nanoid(),
  content: z.string(),
});

export type PostThreadRequest = z.infer<typeof PostThreadSchema>;

export interface PostThreadResponse {
  id: string;
}
