import { validate } from '../commons/validation';
import { NotFoundException } from '../exceptions/NotFoundException';
import { IReplyWithAuthorQS } from '../ports/query-services/IReplyWithAuthorQS';
import {
  GetReplyRequest,
  GetReplyResponse,
  GetReplySchema,
} from './dtos/GetReplyUsecase';

export class GetReplyUsecase {
  constructor(private readonly replyWithAuthorQS: IReplyWithAuthorQS) {}

  async execute(request: GetReplyRequest): Promise<GetReplyResponse> {
    validate(GetReplySchema, request);

    const replyWithAuthors = await this.replyWithAuthorQS.getReplyWithAuthor(
      request.threadID,
      request.replyID,
    );
    if (!replyWithAuthors) {
      throw new NotFoundException('REPLY_NOT_FOUND', 'Reply', 'ID', request.replyID);
    }

    return replyWithAuthors;
  }
}
