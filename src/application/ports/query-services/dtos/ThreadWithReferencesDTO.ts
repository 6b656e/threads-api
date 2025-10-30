import { AuthorDTO } from './AuthorDTO';
import { ThreadDTO } from './ThreadDTO';

export interface ThreadWithReferencesDTO {
  thread: ThreadDTO;
  author: AuthorDTO;
}
