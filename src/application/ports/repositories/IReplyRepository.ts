import { Reply } from 'src/domain/entities/Reply';

export interface IReplyRepository {
  findByID(id: string): Promise<Reply | null>;
  findByThreadID(threadID: string): Promise<Reply[]>;
  save(reply: Reply): Promise<void>;
}
