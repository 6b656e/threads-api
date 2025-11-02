import { Module } from '@nestjs/common';
import { SharedModule } from './SharedModule';
import { ThreadController } from 'src/presentation/controllers/ThreadController';
import {
  POST_THREAD_USECASE_TOKEN,
  PostThreadUsecase,
} from 'src/application/use-cases/PostThreadUsecase';
import {
  IThreadRepository,
  THREAD_REPOSITORY_TOKEN,
} from 'src/application/ports/repositories/IThreadRepository';
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from 'src/application/ports/repositories/IUserRepository';
import {
  REPLY_THREAD_USECASE_TOKEN,
  ReplyThreadUsecase,
} from 'src/application/use-cases/ReplyThreadUsecase';
import {
  IReplyRepository,
  REPLY_REPOSITORY_TOKEN,
} from 'src/application/ports/repositories/IReplyRepository';
import {
  GetThreadUsecase,
  THREAD_DETAIL_USECASE_TOKEN,
} from 'src/application/use-cases/GetThreadUsecase';
import {
  IThreadWithReferencesQS,
  THREAD_WITH_REF_QUERY_TOKEN,
} from 'src/application/ports/query-services/IThreadWithReferencesQS';
import {
  GetReplyUsecase,
  REPLY_DETAIL_USECASE_TOKEN,
} from 'src/application/use-cases/GetReplyUsecase';
import {
  IReplyWithReferencesQS,
  REPLY_WITH_REF_QUERY_TOKEN,
} from 'src/application/ports/query-services/IReplyWithReferencesQS';

@Module({
  imports: [SharedModule],
  controllers: [ThreadController],
  providers: [
    {
      provide: POST_THREAD_USECASE_TOKEN,
      useFactory(threadRepo: IThreadRepository, userRepo: IUserRepository) {
        return new PostThreadUsecase(threadRepo, userRepo);
      },
      inject: [THREAD_REPOSITORY_TOKEN, USER_REPOSITORY_TOKEN],
    },
    {
      provide: THREAD_DETAIL_USECASE_TOKEN,
      useFactory(threadWithReferencesQS: IThreadWithReferencesQS) {
        return new GetThreadUsecase(threadWithReferencesQS);
      },
      inject: [THREAD_WITH_REF_QUERY_TOKEN],
    },
    {
      provide: REPLY_THREAD_USECASE_TOKEN,
      useFactory(
        userRepo: IUserRepository,
        threadRepo: IThreadRepository,
        replyRepo: IReplyRepository,
      ) {
        return new ReplyThreadUsecase(userRepo, threadRepo, replyRepo);
      },
      inject: [USER_REPOSITORY_TOKEN, THREAD_REPOSITORY_TOKEN, REPLY_REPOSITORY_TOKEN],
    },
    {
      provide: REPLY_DETAIL_USECASE_TOKEN,
      useFactory(replyWithReferencesQS: IReplyWithReferencesQS) {
        return new GetReplyUsecase(replyWithReferencesQS);
      },
      inject: [REPLY_WITH_REF_QUERY_TOKEN],
    },
  ],
})
export class ThreadModule {}
