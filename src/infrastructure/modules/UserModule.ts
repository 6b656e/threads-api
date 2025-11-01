import { Module } from '@nestjs/common';
import { UserController } from 'src/presentation/controllers/UserController';
import { SharedModule } from './SharedModule';
import {
  AUTHOR_TIMELINE_USECASE_TOKEN,
  GetAuthorTimelineUsecase,
} from 'src/application/use-cases/GetAuthorTimelineUsecase';
import { AUTHOR_TIMELINE_QUERY_TOKEN } from 'src/application/ports/query-services/IAuthorTimelineQS';
import { IAuthorTimelineQS } from 'src/application/ports/query-services/IAuthorTimelineQS';

@Module({
  imports: [SharedModule],
  controllers: [UserController],
  providers: [
    {
      provide: AUTHOR_TIMELINE_USECASE_TOKEN,
      useFactory(authorTimelineQS: IAuthorTimelineQS) {
        return new GetAuthorTimelineUsecase(authorTimelineQS);
      },
      inject: [AUTHOR_TIMELINE_QUERY_TOKEN],
    },
  ],
})
export class UserModule {}
