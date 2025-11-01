import { AuthorTimelineDTO } from './dtos/AuthorTimelineDTO';

export interface IAuthorTimelineQS {
  getAuthorTimeline(authorID: string): Promise<AuthorTimelineDTO>;
}

export const AUTHOR_TIMELINE_QUERY_TOKEN = Symbol('AuthorTimelineQS');
