import { validate } from '../commons/validation';
import { NotFoundException } from '../exceptions/NotFoundException';
import { IUserProfileQS } from '../ports/query-services/IUserProfileQS';
import {
  GetUserProfileRequest,
  GetUserProfileResponse,
  GetUserProfileSchema,
} from './dtos/GetUserProfileDTO';

export class GetUserProfileUsecase {
  constructor(private readonly userProfileQS: IUserProfileQS) {}

  async execute(request: GetUserProfileRequest): Promise<GetUserProfileResponse> {
    validate(GetUserProfileSchema, request);

    const userProfile = await this.userProfileQS.getUserProfile(request.userID);
    if (!userProfile) {
      throw new NotFoundException('USER_NOT_FOUND_ERROR', 'User', 'ID', request.userID);
    }

    return userProfile;
  }
}
