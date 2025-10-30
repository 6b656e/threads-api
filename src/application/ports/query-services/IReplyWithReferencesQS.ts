import { ReplyWithReferencesDTO } from './dtos/ReplyWithReferencesDTO';

export interface IReplyWithReferencesQS {
  getReplyWithReferences(
    threadID: string,
    replyID: string,
  ): Promise<ReplyWithReferencesDTO | null>;
}
