import { IUserRepository } from 'src/application/ports/repositories/IUserRepository';
import { validate } from 'src/application/commons/validation';
import {
  LoginUserRequest,
  LoginUserResponse,
  LoginUserSchema,
} from './dtos/LoginUserDTO';
import { InvalidCredentialsException } from '../exceptions/InvalidCredentials';
import { IHasherService } from '../ports/services/IHasherService';
import { ITokenManager } from '../ports/services/ITokenManager';

export class LoginUserUsecase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly hasherService: IHasherService,
    private readonly tokenManager: ITokenManager,
  ) {}

  async execute(request: LoginUserRequest): Promise<LoginUserResponse> {
    validate(LoginUserSchema, request);

    const user = await this.userRepo.findByCredentials(request.username);
    if (!user) {
      throw new InvalidCredentialsException(
        'USER_INVALID_CREDENTIALS_ERROR',
        'username or password',
      );
    }

    const isValidPassword = await this.hasherService.compare(
      request.password,
      user.hashedPassword,
    );
    if (!isValidPassword) {
      throw new InvalidCredentialsException(
        'USER_INVALID_CREDENTIALS_ERROR',
        'username or password',
      );
    }

    const tokenPayload = { sub: user.id };
    const accessToken = await this.tokenManager.generate(tokenPayload);

    return { accessToken };
  }
}
