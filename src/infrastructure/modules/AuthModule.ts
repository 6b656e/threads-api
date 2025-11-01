import { Module } from '@nestjs/common';
import {
  REGISTER_USER_USECASE_TOKEN,
  RegisterUserUsecase,
} from 'src/application/use-cases/RegisterUserUsecase';
import { USER_REPOSITORY_TOKEN } from 'src/application/ports/repositories/IUserRepository';
import { HASHER_SERVICE_TOKEN } from 'src/application/ports/services/identity/IHasherService';
import { IUserRepository } from 'src/application/ports/repositories/IUserRepository';
import { IHasherService } from 'src/application/ports/services/identity/IHasherService';
import {
  LOGIN_USER_USECASE_TOKEN,
  LoginUserUsecase,
} from 'src/application/use-cases/LoginUserUsecase';
import { TOKEN_MANAGER_SERVICE_TOKEN } from 'src/application/ports/services/identity/ITokenManagerService';
import { ITokenManagerService } from 'src/application/ports/services/identity/ITokenManagerService';
import {
  AUTHOR_PROFILE_USECASE_TOKEN,
  GetAuthorProfileUsecase,
} from 'src/application/use-cases/GetAuthorProfileUsecase';
import { AUTHOR_PROFILE_QUERY_TOKEN } from 'src/application/ports/query-services/IAuthorProfileQS';
import { IAuthorProfileQS } from 'src/application/ports/query-services/IAuthorProfileQS';
import { SharedModule } from './SharedModule';
import { AuthController } from 'src/presentation/controllers/AuthController';
import {
  LOGOUT_USER_USECASE_TOKEN,
  LogoutUserUsecase,
} from 'src/application/use-cases/LogoutUserUsecase';

@Module({
  imports: [SharedModule],
  controllers: [AuthController],
  providers: [
    {
      provide: REGISTER_USER_USECASE_TOKEN,
      useFactory(userRepo: IUserRepository, hasherService: IHasherService) {
        return new RegisterUserUsecase(userRepo, hasherService);
      },
      inject: [USER_REPOSITORY_TOKEN, HASHER_SERVICE_TOKEN],
    },
    {
      provide: LOGIN_USER_USECASE_TOKEN,
      useFactory(
        userRepo: IUserRepository,
        hasherService: IHasherService,
        tokenManagerService: ITokenManagerService,
      ) {
        return new LoginUserUsecase(userRepo, hasherService, tokenManagerService);
      },
      inject: [USER_REPOSITORY_TOKEN, HASHER_SERVICE_TOKEN, TOKEN_MANAGER_SERVICE_TOKEN],
    },
    {
      provide: AUTHOR_PROFILE_USECASE_TOKEN,
      useFactory(authorProfileQS: IAuthorProfileQS) {
        return new GetAuthorProfileUsecase(authorProfileQS);
      },
      inject: [AUTHOR_PROFILE_QUERY_TOKEN],
    },
    {
      provide: LOGOUT_USER_USECASE_TOKEN,
      useFactory(tokenManagerService: ITokenManagerService) {
        return new LogoutUserUsecase(tokenManagerService);
      },
      inject: [TOKEN_MANAGER_SERVICE_TOKEN],
    },
  ],
})
export class AuthModule {}
