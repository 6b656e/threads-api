import { Reply } from 'src/domain/entities/Reply';

export interface IReplyRepository {
  findById(id: string): Promise<Reply | null>;
  findByThreadId(threadID: string): Promise<Reply[]>;
  save(reply: Reply): Promise<void>;
}
