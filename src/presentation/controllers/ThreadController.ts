import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  POST_THREAD_USECASE_TOKEN,
  PostThreadUsecase,
} from 'src/application/use-cases/PostThreadUsecase';
import { type Payload, TokenPayload } from '../decorators/TokenPayload';
import { AuthGuard } from '../guards/AuthGuard';
import type { PostThreadRequest } from 'src/application/use-cases/dtos/PostThreadDTO';

@Controller('threads')
export class ThreadController {
  constructor(
    @Inject(POST_THREAD_USECASE_TOKEN)
    private readonly postThreadUsecase: PostThreadUsecase,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async postThreads(@TokenPayload() payload: Payload, @Body() body: PostThreadRequest) {
    const data = await this.postThreadUsecase.execute({
      ...body,
      authorID: payload.sub,
    });
    return { data };
  }
}
