import {
  Body,
  Controller,
  Get,
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
import {
  GetThreadUsecase,
  THREAD_DETAIL_USECASE_TOKEN,
} from 'src/application/use-cases/GetThreadUsecase';

@Controller('threads')
export class ThreadController {
  constructor(
    @Inject(POST_THREAD_USECASE_TOKEN)
    private readonly postThreadUsecase: PostThreadUsecase,
    @Inject(THREAD_DETAIL_USECASE_TOKEN)
    private readonly getThreadUsecase: GetThreadUsecase,
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

  @Get(':thread_id')
  @HttpCode(HttpStatus.CREATED)
  async getThreads(@Param('thread_id') threadID: string) {
    const result = await this.getThreadUsecase.execute({
      threadID,
    });
    return {
      data: {
        id: result.thread.id,
        author_id: result.thread.authorID,
        content: result.thread.content,
        created_at: result.thread.createdAt.toISOString(),
        public_metrics: {
          reply_count: result.thread.replyCount,
        },
      },
      includes: {
        users: [result.author],
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
