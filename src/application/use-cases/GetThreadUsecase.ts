import { validate } from '../commons/validation';
import { InconsistencyException } from '../exceptions/InconsitencyException';
import { NotFoundException } from '../exceptions/NotFoundException';
import { IThreadRepository } from '../ports/repositories/IThreadRepository';
import { IUserRepository } from '../ports/repositories/IUserRepository';
import {
  GetThreadRequest,
  GetThreadResponse,
  GetThreadSchema,
} from './dtos/GetThreadDTO';

export class GetThreadUsecase {
  constructor(
    private readonly threadRepo: IThreadRepository,
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(request: GetThreadRequest): Promise<GetThreadResponse> {
    validate(GetThreadSchema, request);

    const thread = await this.threadRepo.findByID(request.threadID);
    if (!thread) {
      throw new NotFoundException(
        'THREAD_NOT_FOUND_ERROR',
        'Thread',
        'ID',
        request.threadID,
      );
    }

    const author = await this.userRepo.findByID(thread.authorID);
    if (!author) {
      throw new InconsistencyException(
        'USER_DATA_INCONSISTENCY_ERROR',
        'Thread exists but author not found',
      );
    }

    return {
      data: {
        id: thread.id,
        author_id: thread.authorID,
        content: thread.content,
        replyCount: thread.replies.length,
        created_at: thread.createdAt.toString(),
      },
      includes: {
        users: [
          {
            id: author.id,
            username: author.username,
          },
        ],
      },
    };
  }
}
