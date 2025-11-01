import { AuthorProfileDTO } from './dtos/AuthorProfileDTO';

export interface IAuthorProfileQS {
  getAuthorProfile(authorID: string): Promise<AuthorProfileDTO | null>;
}

export const AUTHOR_PROFILE_QUERY_TOKEN = Symbol('AuthorProfileQS');
