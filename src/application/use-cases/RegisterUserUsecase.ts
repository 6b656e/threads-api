import { nanoid } from 'nanoid';
import { validate } from '../commons/validation';
import { DuplicationException } from '../exceptions/DuplicationException';
import { IUserRepository } from '../ports/repositories/IUserRepository';
import { IHasherService } from '../ports/services/identity/IHasherService';
import { RegisterUserRequest, RegisterUserSchema } from './dtos/RegisterUserDTO';
import { User } from 'src/domain/entities/User';

export class RegisterUserUsecase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly hasherService: IHasherService,
  ) {}

  async execute(request: RegisterUserRequest): Promise<void> {
    validate(RegisterUserSchema, request);

    const user = await this.userRepo.findByCredentials(request.username);
    if (user) {
      throw new DuplicationException(
        'USER_NAME_ALREADY_TAKEN_ERROR',
        'User',
        'username',
        request.username,
      );
    }

    const hashedPassword = await this.hasherService.hash(request.password);

    await this.userRepo.save(
      User.create({
        id: nanoid(),
        username: request.username,
        hashedPassword,
      }),
    );
  }
}

export const REGISTER_USER_USECASE_TOKEN = Symbol(RegisterUserUsecase.name);
