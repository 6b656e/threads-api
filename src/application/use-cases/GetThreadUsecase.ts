import { validate } from '../commons/validation';
import { NotFoundException } from '../exceptions/NotFoundException';
import { ThreadWithReferencesDTO } from '../ports/query-services/dtos/ThreadWithReferencesDTO';
import { IThreadWithReferencesQS } from '../ports/query-services/IThreadWithReferencesQS';
import { GetThreadRequest, GetThreadSchema } from './dtos/GetThreadDTO';

export class GetThreadUsecase {
  constructor(private readonly threadWithReferencesQS: IThreadWithReferencesQS) {}

  async execute(request: GetThreadRequest): Promise<ThreadWithReferencesDTO> {
    validate(GetThreadSchema, request);

    const threadWithRefs = await this.threadWithReferencesQS.getThreadWithReferences(
      request.threadID,
    );
    if (!threadWithRefs) {
      throw new NotFoundException(
        'THREAD_NOT_FOUND_ERROR',
        'Thread',
        'ID',
        request.threadID,
      );
    }

    return threadWithRefs;
  }
}
