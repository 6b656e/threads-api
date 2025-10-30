import * as z from 'zod';

export const GetAuthorProfileSchema = z.object({
  authorID: z.nanoid(),
});

export type GetAuthorProfileRequest = z.infer<typeof GetAuthorProfileSchema>;
