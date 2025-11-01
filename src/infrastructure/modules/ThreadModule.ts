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
  ],
})
export class ThreadModule {}
