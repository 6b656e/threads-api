import { AuthorTimelineDTO } from './dtos/AuthorTimelineDTO';

export interface IAuthorTimelineQS {
  getAuthorTimeline(authorID: string): Promise<AuthorTimelineDTO | null>;
}
