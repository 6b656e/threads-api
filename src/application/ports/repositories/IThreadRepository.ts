import { Thread } from 'src/domain/entities/Thread';

export interface IThreadRepository {
  save(thread: Thread): Promise<void>;
  findByID(id: string): Promise<Thread | null>;
}

export const THREAD_REPOSITORY_TOKEN = Symbol('ThreadRepository');
