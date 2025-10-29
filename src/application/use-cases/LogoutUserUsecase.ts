import { validate } from '../commons/validation';
import { NotFoundException } from '../exceptions/NotFoundException';
import { IUserRepository } from '../ports/repositories/IUserRepository';
import { ITokenManager } from '../ports/services/ITokenManager';
import {
  LogoutUserRequest,
  LogoutUserResponse,
  LogoutUserSchema,
} from './dtos/LogoutUserDTO';

export class LogoutUserUsecase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenManager: ITokenManager,
  ) {}

  async execute(request: LogoutUserRequest): Promise<LogoutUserResponse> {
    validate(LogoutUserSchema, request);

    const user = await this.userRepo.findByID(request.userID);
    if (!user) {
      throw new NotFoundException('USER_NOT_FOUND_ERROR', 'User', 'ID', request.userID);
    }

    await this.tokenManager.blacklist(
      request.accessToken,
      request.userID,
      request.tokenExpiresAt,
    );

    return {
      message: 'User logout successful',
    };
  }
}
