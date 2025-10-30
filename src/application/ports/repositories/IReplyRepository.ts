import { Reply } from 'src/domain/entities/Reply';

export interface IReplyRepository {
  findByID(id: string): Promise<Reply | null>;
  save(reply: Reply): Promise<void>;
}
