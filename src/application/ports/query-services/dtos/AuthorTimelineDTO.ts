import { AuthorDTO } from './AuthorDTO';
import { ReplyDTO } from './ReplyDTO';
import { ThreadDTO } from './ThreadDTO';

export interface AuthorTimelineDTO {
  replies: ReplyDTO[];
  thread: ThreadDTO[];
  authors: AuthorDTO[];
}
