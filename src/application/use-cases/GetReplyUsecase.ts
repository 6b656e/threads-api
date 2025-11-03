import { validate } from '../commons/validation';
import { NotFoundException } from '../exceptions/NotFoundException';
import { ReplyWithReferencesDTO } from '../ports/query-services/dtos/ReplyWithReferencesDTO';
import { IReplyWithReferencesQS } from '../ports/query-services/IReplyWithReferencesQS';
import { GetReplyRequest, GetReplySchema } from './dtos/GetReplyDTO';

export class GetReplyUsecase {
  constructor(private readonly replyWithReferencesQS: IReplyWithReferencesQS) {}

  async execute(request: GetReplyRequest): Promise<ReplyWithReferencesDTO> {
    const data = validate(GetReplySchema, request);

    const replyWithRefs = await this.replyWithReferencesQS.getReplyWithReferences(
      data.threadID,
      data.replyID,
    );
    if (!replyWithRefs) {
      throw new NotFoundException('REPLY_NOT_FOUND_ERROR', 'Reply', 'ID', data.replyID);
    }

    return replyWithRefs;
  }
}

export const REPLY_DETAIL_USECASE_TOKEN = Symbol(GetReplyUsecase.name);
