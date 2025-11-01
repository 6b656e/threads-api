import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { LoginUserRequest } from 'src/application/use-cases/dtos/LoginUserDTO';
import type { RegisterUserRequest } from 'src/application/use-cases/dtos/RegisterUserDTO';
import {
  LOGIN_USER_USECASE_TOKEN,
  LoginUserUsecase,
} from 'src/application/use-cases/LoginUserUsecase';
import {
  REGISTER_USER_USECASE_TOKEN,
  RegisterUserUsecase,
} from 'src/application/use-cases/RegisterUserUsecase';
import { AuthGuard } from '../guards/AuthGuard';
import { TokenPayload, type Payload } from '../decorators/TokenPayload';
import {
  AUTHOR_PROFILE_USECASE_TOKEN,
  GetAuthorProfileUsecase,
} from 'src/application/use-cases/GetAuthorProfileUsecase';
import {
  LOGOUT_USER_USECASE_TOKEN,
  LogoutUserUsecase,
} from 'src/application/use-cases/LogoutUserUsecase';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(REGISTER_USER_USECASE_TOKEN)
    private readonly registerUserUsecase: RegisterUserUsecase,
    @Inject(LOGIN_USER_USECASE_TOKEN)
    private readonly loginUserUsecase: LoginUserUsecase,
    @Inject(AUTHOR_PROFILE_USECASE_TOKEN)
    private readonly getAuthorProfileUsecase: GetAuthorProfileUsecase,
    @Inject(LOGOUT_USER_USECASE_TOKEN)
    private readonly logoutUserUsecase: LogoutUserUsecase,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async postAuthRegister(@Body() request: RegisterUserRequest) {
    await this.registerUserUsecase.execute(request);
    return { message: 'User registered successfully' };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async postAuthLogin(@Body() request: LoginUserRequest) {
    const data = await this.loginUserUsecase.execute(request);
    return { data };
  }

  @UseGuards(AuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getAuthMe(@TokenPayload() payload: Payload) {
    const data = await this.getAuthorProfileUsecase.execute({
      authorID: payload.sub,
    });
    return {
      ...data,
      createdAt: data.createdAt.toString(),
    };
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async postAuthLogout(
    @TokenPayload('token') token: string,
    @TokenPayload() payload: Payload,
  ) {
    await this.logoutUserUsecase.execute({
      userID: payload.sub,
      tokenExpiresAt: new Date(payload.exp * 1000),
      accessToken: token,
    });
    return { message: 'User successfully logged out' };
  }
}
