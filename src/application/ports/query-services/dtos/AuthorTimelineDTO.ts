import { AuthorDTO } from './AuthorDTO';
import { ReplyDTO } from './ReplyDTO';
import { ThreadDTO } from './ThreadDTO';

export interface AuthorTimelineDTO {
  replies: ReplyDTO[];
  threads: ThreadDTO[];
  authors: AuthorDTO[];
}
