import { AuthorDTO } from './AuthorDTO';

export type AuthorProfileDTO = AuthorDTO & {
  threadCount: number;
  replyCount: number;
  createdAt: Date;
};
