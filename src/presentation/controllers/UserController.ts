import { Controller, Get, HttpCode, HttpStatus, Inject, Param } from '@nestjs/common';
import {
  AUTHOR_TIMELINE_USECASE_TOKEN,
  GetAuthorTimelineUsecase,
} from 'src/application/use-cases/GetAuthorTimelineUsecase';

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
    // return result;
    const transformedThreads = result.threads.map((thread) => ({
      id: thread.id,
      author_id: thread.authorID,
      text: thread.content,
      created_at: thread.createdAt.toISOString(),
      public_metrics: {
        reply_count: thread.replyCount,
      },
    }));
    const transformedReplies = result.replies.map((reply) => ({
      id: reply.id,
      author_id: reply.authorID,
      text: reply.content,
      created_at: reply.createdAt.toISOString(),
      referenced_threads: [
        {
          type: 'replied_to',
          id: reply.threadID,
        },
      ],
    }));
    const allData = [
      ...transformedThreads.filter((t) => t.author_id === authorID),
      ...transformedReplies,
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const refThreadIDs = new Set(result.replies.map((reply) => reply.threadID));
    const refThreads = transformedThreads.filter((thread) => refThreadIDs.has(thread.id));
    const users = result.authors.map((author) => ({
      id: author.id,
      username: author.username,
    }));
    return {
      data: allData,
      includes: {
        threads: refThreads,
        users,
      },
    };
  }
}
