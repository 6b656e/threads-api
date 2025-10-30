import { Thread } from 'src/domain/entities/Thread';

export interface IThreadRepository {
  save(thread: Thread): Promise<void>;
  findByID(id: string): Promise<Thread | null>;
  findByIDWithAuthor(id: string, authorID: string): Promise<Thread | null>;
}
