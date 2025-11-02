import { Controller, Get, HttpCode, HttpStatus, Inject, Param } from '@nestjs/common';
import {
  AUTHOR_TIMELINE_USECASE_TOKEN,
  GetAuthorTimelineUsecase,
} from 'src/application/use-cases/GetAuthorTimelineUsecase';
import { ThreadMapper } from './mappers/ThreadMapper';
import { ReplyMapper } from './mappers/ReplyMapper';
import { UserMapper } from './mappers/UserMapper';

@Controller('users')
export class UserController {
  constructor(
    @Inject(AUTHOR_TIMELINE_USECASE_TOKEN)
    private readonly getAuthorTimelineUsecase: GetAuthorTimelineUsecase,
  ) {}

  @Get(':author_id/timeline')
  @HttpCode(HttpStatus.OK)
  async getUsersIDTimeline(@Param('author_id') authorID: string) {
    const result = await this.getAuthorTimelineUsecase.execute({ authorID });
    const transformedThreads = ThreadMapper.toResponseList(result.threads);
    const transformedReplies = ReplyMapper.toResponseList(result.replies);

    const allData = [
      ...transformedThreads.filter((t) => t.author_id === authorID),
      ...transformedReplies,
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const refThreadIDs = new Set(result.replies.map((reply) => reply.threadID));
    const refThreads = transformedThreads.filter((thread) => refThreadIDs.has(thread.id));

    return {
      data: allData,
      includes: {
        threads: refThreads,
        users: UserMapper.toResponseList(result.authors),
      },
    };
  }
}
