import { IUserRepository } from 'src/application/ports/repositories/IUserRepository';
import { validate } from 'src/application/commons/validation';
import {
  LoginUserRequest,
  LoginUserResponse,
  LoginUserSchema,
} from './dtos/LoginUserDTO';
import { InvalidCredentialsException } from '../exceptions/InvalidCredentials';
import { IHasherService } from '../ports/services/identity/IHasherService';
import { ITokenManagerService } from '../ports/services/identity/ITokenManagerService';

export class LoginUserUsecase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly hasherService: IHasherService,
    private readonly tokenManagerService: ITokenManagerService,
  ) {}

  async execute(request: LoginUserRequest): Promise<LoginUserResponse> {
    const data = validate(LoginUserSchema, request);

    const user = await this.userRepo.findByCredentials(data.username);
    if (!user) {
      throw new InvalidCredentialsException(
        'USER_INVALID_CREDENTIALS_ERROR',
        'username or password',
      );
    }

    const isValidPassword = await this.hasherService.compare(
      data.password,
      user.hashedPassword,
    );
    if (!isValidPassword) {
      throw new InvalidCredentialsException(
        'USER_INVALID_CREDENTIALS_ERROR',
        'username or password',
      );
    }

    const accessToken = await this.tokenManagerService.generate(user.id);

    return { accessToken };
  }
}

export const LOGIN_USER_USECASE_TOKEN = Symbol(LoginUserUsecase.name);
