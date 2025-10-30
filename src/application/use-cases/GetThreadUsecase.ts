import { validate } from '../commons/validation';
import { NotFoundException } from '../exceptions/NotFoundException';
import { IThreadWithAuthorQS } from '../ports/query-services/IThreadWithAuthorQS';
import {
  GetThreadRequest,
  GetThreadResponse,
  GetThreadSchema,
} from './dtos/GetThreadDTO';

export class GetThreadUsecase {
  constructor(private readonly threadWithAuthorQS: IThreadWithAuthorQS) {}

  async execute(request: GetThreadRequest): Promise<GetThreadResponse> {
    validate(GetThreadSchema, request);

    const threadWithAuthor = await this.threadWithAuthorQS.getThreadWithAuthor(
      request.threadID,
    );
    if (!threadWithAuthor) {
      throw new NotFoundException(
        'THREAD_NOT_FOUND_ERROR',
        'Thread',
        'ID',
        request.threadID,
      );
    }

    return threadWithAuthor;
  }
}
