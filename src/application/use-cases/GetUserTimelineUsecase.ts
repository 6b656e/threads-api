import { validate } from '../commons/validation';
import { NotFoundException } from '../exceptions/NotFoundException';
import { IUserTimelineQS } from '../ports/query-services/IUserTimelineQS';
import {
  GetUserTimelineRequest,
  GetUserTimelineResponse,
  GetUserTimelineSchema,
} from './dtos/GetUserTimeline';

export class GetUserTimelineUsecase {
  constructor(private readonly userTimelineQS: IUserTimelineQS) {}

  async execute(request: GetUserTimelineRequest): Promise<GetUserTimelineResponse> {
    validate(GetUserTimelineSchema, request);

    const userTimeline = await this.userTimelineQS.getUserTimeline(request.userID);
    if (!userTimeline) {
      throw new NotFoundException('USER_NOT_FOUND_ERROR', 'User', 'ID', request.userID);
    }

    return userTimeline;
  }
}
