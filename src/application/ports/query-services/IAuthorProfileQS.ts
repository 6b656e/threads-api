import { AuthorProfileDTO } from './dtos/AuthorProfileDTO';

export interface IAuthorProfileQS {
  getAuthorProfile(authorID: string): Promise<AuthorProfileDTO | null>;
}
