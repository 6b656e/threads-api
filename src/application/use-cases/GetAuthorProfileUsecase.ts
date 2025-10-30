import { validate } from '../commons/validation';
import { NotFoundException } from '../exceptions/NotFoundException';
import { AuthorProfileDTO } from '../ports/query-services/dtos/AuthorProfileDTO';
import { IAuthorProfileQS } from '../ports/query-services/IAuthorProfileQS';
import {
  GetAuthorProfileRequest,
  GetAuthorProfileSchema,
} from './dtos/GetAuthorProfileDTO';

export class GetAuthorProfileUsecase {
  constructor(private readonly authorProfileQS: IAuthorProfileQS) {}

  async execute(request: GetAuthorProfileRequest): Promise<AuthorProfileDTO> {
    validate(GetAuthorProfileSchema, request);

    const authorProfile = await this.authorProfileQS.getAuthorProfile(request.authorID);
    if (!authorProfile) {
      throw new NotFoundException('USER_NOT_FOUND_ERROR', 'User', 'ID', request.authorID);
    }

    return authorProfile;
  }
}
