import { validate } from '../commons/validation';
import { ITokenManager } from '../ports/services/ITokenManager';
import { LogoutUserRequest, LogoutUserSchema } from './dtos/LogoutUserDTO';

export class LogoutUserUsecase {
  constructor(private readonly tokenManager: ITokenManager) {}

  async execute(request: LogoutUserRequest): Promise<void> {
    validate(LogoutUserSchema, request);

    await this.tokenManager.blacklist(
      request.accessToken,
      request.userID,
      request.tokenExpiresAt,
    );
  }
}
