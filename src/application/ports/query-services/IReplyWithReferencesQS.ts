import { ReplyWithReferencesDTO } from './dtos/ReplyWithReferencesDTO';

export interface IReplyWithReferencesQS {
  getReplyWithReferences(
    threadID: string,
    replyID: string,
  ): Promise<ReplyWithReferencesDTO | null>;
}

export const REPLY_WITH_REF_QUERY_TOKEN = Symbol('ReplyWithReferencesQS');
