import { validate } from '../commons/validation';
import { AuthorTimelineDTO } from '../ports/query-services/dtos/AuthorTimelineDTO';
import { IAuthorTimelineQS } from '../ports/query-services/IAuthorTimelineQS';
import {
  GetAuthorTimelineRequest,
  GetAuthorTimelineSchema,
} from './dtos/GetAuthorTimeline';

export class GetAuthorTimelineUsecase {
  constructor(private readonly authorTimelineQS: IAuthorTimelineQS) {}

  async execute(request: GetAuthorTimelineRequest): Promise<AuthorTimelineDTO> {
    const data = validate(GetAuthorTimelineSchema, request);

    const authorTimeline = await this.authorTimelineQS.getAuthorTimeline(data.authorID);

    return authorTimeline;
  }
}

export const AUTHOR_TIMELINE_USECASE_TOKEN = Symbol(GetAuthorTimelineUsecase.name);
