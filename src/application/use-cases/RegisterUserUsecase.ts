import { nanoid } from 'nanoid';
import { validate } from '../commons/validation';
import { DuplicationException } from '../exceptions/DuplicationException';
import { IUserRepository } from '../ports/repositories/IUserRepository';
import { IHasherService } from '../ports/services/IHasherService';
import {
  RegisterUserRequest,
  RegisterUserResponse,
  RegisterUserSchema,
} from './dtos/RegisterUserDTO';
import { User } from 'src/domain/entities/User';

export class RegisterUserUsecase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordHasher: IHasherService,
  ) {}

  async execute(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    validate(RegisterUserSchema, request);

    const user = await this.userRepo.userWithCredentials(request.username);
    if (user) {
      throw new DuplicationException(
        'USER_NAME_ALREADY_TAKEN_ERROR',
        'User',
        'username',
        request.username,
      );
    }

    const hashedPassword = await this.passwordHasher.hash(request.password);

    await this.userRepo.register(
      User.create({
        id: nanoid(),
        username: request.username,
        hashedPassword,
      }),
    );

    return {
      message: 'User registration successful',
    };
  }
}
