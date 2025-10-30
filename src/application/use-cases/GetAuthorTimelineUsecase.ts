import { validate } from '../commons/validation';
import { NotFoundException } from '../exceptions/NotFoundException';
import { AuthorTimelineDTO } from '../ports/query-services/dtos/AuthorTimelineDTO';
import { IAuthorTimelineQS } from '../ports/query-services/IAuthorTimelineQS';
import {
  GetAuthorTimelineRequest,
  GetAuthorTimelineSchema,
} from './dtos/GetAuthorTimeline';

export class GetAuthorTimelineUsecase {
  constructor(private readonly authorTimelineQS: IAuthorTimelineQS) {}

  async execute(request: GetAuthorTimelineRequest): Promise<AuthorTimelineDTO> {
    validate(GetAuthorTimelineSchema, request);

    const authorTimeline = await this.authorTimelineQS.getAuthorTimeline(
      request.authorID,
    );
    if (!authorTimeline) {
      throw new NotFoundException('USER_NOT_FOUND_ERROR', 'User', 'ID', request.authorID);
    }

    return authorTimeline;
  }
}
