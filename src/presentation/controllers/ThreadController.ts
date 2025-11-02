import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
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
import { type ReplyThreadRequest } from 'src/application/use-cases/dtos/ReplyThreadDTO';
import {
  REPLY_THREAD_USECASE_TOKEN,
  ReplyThreadUsecase,
} from 'src/application/use-cases/ReplyThreadUsecase';

@Controller('threads')
export class ThreadController {
  constructor(
    @Inject(POST_THREAD_USECASE_TOKEN)
    private readonly postThreadUsecase: PostThreadUsecase,
    @Inject(REPLY_THREAD_USECASE_TOKEN)
    private readonly replyThreadUsecase: ReplyThreadUsecase,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async postThreads(@TokenPayload() payload: Payload, @Body() body: PostThreadRequest) {
    const result = await this.postThreadUsecase.execute({
      ...body,
      authorID: payload.sub,
    });
    return {
      data: {
        id: result.id,
      },
    };
  }

  @UseGuards(AuthGuard)
  @Post(':thread_id/replies')
  @HttpCode(HttpStatus.CREATED)
  async postThreadIDReplies(
    @TokenPayload() payload: Payload,
    @Param('thread_id') threadID: string,
    @Body() body: ReplyThreadRequest,
  ) {
    const result = await this.replyThreadUsecase.execute({
      ...body,
      threadID,
      authorID: payload.sub,
    });
    return {
      data: {
        id: result.id,
      },
    };
  }
}
