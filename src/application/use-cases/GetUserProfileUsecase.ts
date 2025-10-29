import { validate } from '../commons/validation';
import { NotFoundException } from '../exceptions/NotFoundException';
import { IUserProfileQueryService } from '../ports/query-services/IUserProfileQueryService';
import {
  GetUserProfileRequest,
  GetUserProfileResponse,
  GetUserProfileSchema,
} from './dtos/GetUserProfileDTO';

export class GetUserProfileUsecase {
  constructor(private readonly userProfileQS: IUserProfileQueryService) {}

  async execute(request: GetUserProfileRequest): Promise<GetUserProfileResponse> {
    validate(GetUserProfileSchema, request);

    const profile = await this.userProfileQS.getUserProfile(request.userID);
    if (!profile) {
      throw new NotFoundException('USER_NOT_FOUND_ERROR', 'User', 'ID', request.userID);
    }

    return {
      data: {
        id: profile.id,
        username: profile.username,
        thread_count: profile.threadCount,
        reply_count: profile.replyCount,
        created_at: profile.createdAt.toString(),
      },
    };
  }
}
