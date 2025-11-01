import { validate } from '../commons/validation';
import { ITokenManagerService } from '../ports/services/identity/ITokenManagerService';
import { LogoutUserRequest, LogoutUserSchema } from './dtos/LogoutUserDTO';

export class LogoutUserUsecase {
  constructor(private readonly tokenManager: ITokenManagerService) {}

  async execute(request: LogoutUserRequest): Promise<void> {
    validate(LogoutUserSchema, request);

    const isBlacklisted = await this.tokenManager.isBlacklisted(request.accessToken);
    if (isBlacklisted) return;

    await this.tokenManager.blacklist(
      request.accessToken,
      request.userID,
      request.tokenExpiresAt,
    );
  }
}

export const LOGOUT_USER_USECASE_TOKEN = Symbol(LogoutUserUsecase.name);
