import { Thread } from 'src/domain/entities/Thread';

export interface IThreadRepository {
  save(thread: Thread): Promise<void>;
}
