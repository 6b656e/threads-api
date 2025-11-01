import { Thread } from 'src/domain/entities/Thread';
import { validate } from '../commons/validation';
import { NotFoundException } from '../exceptions/NotFoundException';
import { IThreadRepository } from '../ports/repositories/IThreadRepository';
import { IUserRepository } from '../ports/repositories/IUserRepository';
import {
  PostThreadRequest,
  PostThreadResponse,
  PostThreadSchema,
} from './dtos/PostThreadDTO';
import { nanoid } from 'nanoid';

export class PostThreadUsecase {
  constructor(
    private readonly threadRepo: IThreadRepository,
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(request: PostThreadRequest): Promise<PostThreadResponse> {
    validate(PostThreadSchema, request);

    const author = await this.userRepo.findByID(request.authorID);
    if (!author) {
      throw new NotFoundException('USER_NOT_FOUND_ERROR', 'User', 'ID', request.authorID);
    }

    const id = nanoid();

    await this.threadRepo.save(
      Thread.create({
        id,
        authorID: request.authorID,
        content: request.content,
      }),
    );

    return { id };
  }
}

export const POST_THREAD_USECASE_TOKEN = Symbol(PostThreadUsecase.name);
