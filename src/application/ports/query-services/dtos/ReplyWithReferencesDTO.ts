import { AuthorDTO } from './AuthorDTO';
import { ReplyDTO } from './ReplyDTO';
import { ThreadDTO } from './ThreadDTO';

export interface ReplyWithReferencesDTO {
  reply: ReplyDTO;
  thread: ThreadDTO;
  authors: AuthorDTO[];
}
