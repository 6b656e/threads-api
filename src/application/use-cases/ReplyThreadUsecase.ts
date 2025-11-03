import { nanoid } from 'nanoid';
import { Reply } from 'src/domain/entities/Reply';
import { validate } from '../commons/validation';
import { NotFoundException } from '../exceptions/NotFoundException';
import { IReplyRepository } from '../ports/repositories/IReplyRepository';
import { IThreadRepository } from '../ports/repositories/IThreadRepository';
import { IUserRepository } from '../ports/repositories/IUserRepository';
import {
  ReplyThreadRequest,
  ReplyThreadResponse,
  ReplyThreadSchema,
} from './dtos/ReplyThreadDTO';

export class ReplyThreadUsecase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly threadRepo: IThreadRepository,
    private readonly replyRepo: IReplyRepository,
  ) {}

  async execute(request: ReplyThreadRequest): Promise<ReplyThreadResponse> {
    const data = validate(ReplyThreadSchema, request);

    const [author, thread] = await Promise.all([
      this.userRepo.findByID(data.authorID),
      this.threadRepo.findByID(data.threadID),
    ]);

    if (!author) {
      throw new NotFoundException('USER_NOT_FOUND_ERROR', 'User', 'ID', data.authorID);
    }
    if (!thread) {
      throw new NotFoundException(
        'THREAD_NOT_FOUND_ERROR',
        'Thread',
        'ID',
        data.threadID,
      );
    }

    const id = nanoid();

    await this.replyRepo.save(
      Reply.create({
        id,
        authorID: data.authorID,
        threadID: data.threadID,
        content: data.content,
      }),
    );

    return { id };
  }
}

export const REPLY_THREAD_USECASE_TOKEN = Symbol(ReplyThreadUsecase.name);
