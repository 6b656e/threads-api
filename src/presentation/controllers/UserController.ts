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
    const data = await this.getAuthorTimelineUsecase.execute({ authorID });
    return { data };
  }
}
